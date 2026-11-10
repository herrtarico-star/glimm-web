/*
 * Glimm native bridge: connects the game (window.GlimmNative) to the app plugins.
 * Runs only inside the Android/iOS app; in the browser it does nothing and the game shows its placeholders.
 *
 * Plugins: @capacitor-community/admob, @capacitor/share, @capacitor/local-notifications
 * Purchases (RevenueCat) follow once the store products exist.
 */
(function () {
  const Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  const P = Cap.Plugins || {};
  const AdMob = P.AdMob, Share = P.Share, LocalNotifications = P.LocalNotifications, Purchases = P.Purchases;
  const isIOS = Cap.getPlatform() === 'ios';

  // AdMob app IDs (also in AndroidManifest.xml / Info.plist):
  //   Android ca-app-pub-9967546462971667~8827598734 · iOS ca-app-pub-9967546462971667~1795286526
  // Ad units: Google's official test units until the real ones are created. Set LIVE to true only together
  // with the real unit IDs, right before release. Never tap your own live ads.
  const LIVE = false;
  const UNITS = LIVE ? {
    rewarded: isIOS ? 'ca-app-pub-9967546462971667/IOS_REWARDED' : 'ca-app-pub-9967546462971667/ANDROID_REWARDED',
    interstitial: isIOS ? 'ca-app-pub-9967546462971667/IOS_INTERSTITIAL' : 'ca-app-pub-9967546462971667/ANDROID_INTERSTITIAL',
    banner: isIOS ? 'ca-app-pub-9967546462971667/IOS_BANNER' : 'ca-app-pub-9967546462971667/ANDROID_BANNER',
  } : {
    rewarded: isIOS ? 'ca-app-pub-3940256099942544/1712485313' : 'ca-app-pub-3940256099942544/5224354917',
    interstitial: isIOS ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712',
    banner: isIOS ? 'ca-app-pub-3940256099942544/2435281174' : 'ca-app-pub-3940256099942544/9214589741',
  };
  const TESTING = !LIVE;

  const REVENUECAT_KEY = isIOS ? 'appl_XXXX' : 'goog_XXXX';
  const VIP_ENTITLEMENT = 'vip';
  const PRODUCTS = {
    noads: 'glimm_noads', small: 'glimm_sparks_small', big: 'glimm_sparks_big', supp: 'glimm_supporter',
    starter: 'glimm_starter', piggy: 'glimm_piggy', pass: 'glimm_season_pass', vip: 'glimm_vip_weekly',
  };

  // ---- ads: consent first (Google UMP), then Apple's tracking prompt, then start the SDK ----
  let adsReady = false, adsStart = null;
  function startAds() {
    if (adsStart) return adsStart;
    adsStart = (async () => {
      if (!AdMob) return;
      try {
        const info = await AdMob.requestConsentInfo();
        if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
      } catch (e) { console.warn('consent', e); }
      if (isIOS) {
        try {
          const st = await AdMob.trackingAuthorizationStatus();
          if (st && st.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
        } catch (e) { console.warn('tracking', e); }
      }
      try { await AdMob.initialize({ initializeForTesting: TESTING }); adsReady = true; } catch (e) { console.warn('admob init', e); }
    })();
    return adsStart;
  }

  // rewarded videos only pay out when Google reports the reward, not when the player closes early
  function playRewarded() {
    return new Promise(async resolve => {
      let rewarded = false, done = false; const hs = [];
      const finish = v => { if (done) return; done = true; hs.forEach(h => h && h.remove && h.remove()); resolve(v); };
      try {
        hs.push(await AdMob.addListener('onRewardedVideoAdReward', () => { rewarded = true; }));
        hs.push(await AdMob.addListener('onRewardedVideoAdDismissed', () => finish(rewarded)));
        hs.push(await AdMob.addListener('onRewardedVideoAdFailedToShow', () => finish(false)));
        await AdMob.prepareRewardVideoAd({ adId: UNITS.rewarded, isTesting: TESTING });
        const item = await AdMob.showRewardVideoAd();
        if (item && item.amount) rewarded = true;
        setTimeout(() => finish(rewarded), 1500); // some versions resolve show() only after closing
      } catch (e) { console.warn('rewarded', e); finish(false); }
    });
  }

  let rcReady = null;
  function startPurchases() {
    if (rcReady) return rcReady;
    rcReady = (async () => {
      if (!Purchases || /XXXX/.test(REVENUECAT_KEY)) return false;
      try { await Purchases.configure({ apiKey: REVENUECAT_KEY }); return true; } catch (e) { console.warn('purchases', e); return false; }
    })();
    return rcReady;
  }

  // tell the game which reminder text was opened, so it learns which texts work best
  try {
    LocalNotifications && LocalNotifications.addListener('localNotificationActionPerformed', a => {
      const v = a && a.notification && a.notification.extra && a.notification.extra.variant;
      if (v && window.glimmNotificationOpened) window.glimmNotificationOpened(v);
    });
  } catch (e) {}

  window.GlimmNative = {
    track(name, props) { /* no external analytics service yet; see privacy policy */ },
    async showRewarded() {
      await startAds(); if (!adsReady) return false;
      return playRewarded();
    },
    async showInterstitial() {
      await startAds(); if (!adsReady) return;
      try { await AdMob.prepareInterstitial({ adId: UNITS.interstitial, isTesting: TESTING }); await AdMob.showInterstitial(); }
      catch (e) { console.warn('interstitial', e); }
    },
    async showBanner() {
      await startAds(); if (!adsReady) return;
      try { await AdMob.showBanner({ adId: UNITS.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: TESTING }); }
      catch (e) { console.warn('banner', e); }
    },
    async hideBanner() { try { AdMob && await AdMob.hideBanner(); } catch (e) {} },
    // reopens Google's ad consent form (Options → Privacy)
    async adPrivacy() {
      if (!AdMob) return;
      try { await startAds(); await AdMob.showPrivacyOptionsForm(); } catch (e) { console.warn('privacy options', e); }
    },
    async purchase(id) {
      if (!(await startPurchases())) return 'unavailable';
      try {
        const { products } = await Purchases.getProducts({ productIdentifiers: [PRODUCTS[id]], type: id === 'vip' ? 'SUBSCRIPTION' : 'NON_SUBSCRIPTION' });
        if (!products || !products.length) return false;
        await Purchases.purchaseStoreProduct({ product: products[0] });
        return true;
      } catch (e) { console.warn('purchase', id, e); return false; }
    },
    async vipActive() {
      if (!(await startPurchases())) return undefined;
      try { const { customerInfo } = await Purchases.getCustomerInfo(); return !!customerInfo.entitlements.active[VIP_ENTITLEMENT]; }
      catch (e) { return undefined; }
    },
    async requestNotificationPermission() { try { LocalNotifications && await LocalNotifications.requestPermissions(); } catch (e) {} },
    async scheduleNotifications(list) {
      if (!LocalNotifications) return;
      try {
        await LocalNotifications.cancel({ notifications: list.map(n => ({ id: n.id })) });
        const due = list.filter(n => n.at > Date.now());
        if (due.length) await LocalNotifications.schedule({ notifications: due.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: new Date(n.at) }, extra: n.extra || null })) });
      } catch (e) { console.warn('notifications', e); }
    },
    async share({ text }) { if (Share) await Share.share({ text, title: 'Glimm' }); },
    async remoteConfig() {
      const r = await fetch('https://glimm-game.com/config.json', { cache: 'no-store' });
      return r.ok ? r.json() : null;
    },
  };
})();
