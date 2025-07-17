/**
 * Privacy Service - Manages user consent and data collection
 * This is where all privacy consent checking happens
 */

export interface PrivacyConsent {
  allowAppAnalytics: boolean;
  allowLocationInsights: boolean;
  receiveLocalOffers: boolean;
}

class PrivacyService {
  private static instance: PrivacyService;
  private consent: PrivacyConsent = {
    allowAppAnalytics: true,  // Default values
    allowLocationInsights: false,
    receiveLocalOffers: false,
  };

  static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Update consent settings (called from Settings screen)
   */
  updateConsent(newConsent: Partial<PrivacyConsent>) {
    this.consent = { ...this.consent, ...newConsent };
    console.log('Privacy consent updated:', this.consent);
  }

  /**
   * Get current consent settings
   */
  getConsent(): PrivacyConsent {
    return { ...this.consent };
  }

  /**
   * Check if analytics tracking is allowed
   */
  canTrackAnalytics(): boolean {
    return this.consent.allowAppAnalytics;
  }

  /**
   * Check if location data sharing is allowed
   */
  canShareLocationData(): boolean {
    return this.consent.allowLocationInsights;
  }

  /**
   * Check if personalized offers are allowed
   */
  canShowPersonalizedOffers(): boolean {
    return this.consent.receiveLocalOffers;
  }

  /**
   * Track user action (only if consent given)
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.canTrackAnalytics()) {
      console.log('Analytics disabled - not tracking:', eventName);
      return;
    }

    // Here you would integrate with analytics service like:
    // - Firebase Analytics
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics endpoint
    
    console.log('Analytics Event:', eventName, properties);
    
    // Example: Send to your analytics endpoint
    // this.sendToAnalytics(eventName, properties);
  }

  /**
   * Share location data (only if consent given)
   */
  shareLocationData(location: { latitude: number; longitude: number }, context: string) {
    if (!this.canShareLocationData()) {
      console.log('Location sharing disabled - not sharing for:', context);
      return;
    }

    console.log('Sharing location data:', { location, context });
    
    // Here you would send to location analytics service
    // this.sendLocationToService(location, context);
  }

  /**
   * Log personalized offer shown (only if consent given)
   */
  logOfferShown(offerId: string, offerType: string) {
    if (!this.canShowPersonalizedOffers()) {
      console.log('Personalized offers disabled - not logging offer:', offerId);
      return;
    }

    console.log('Offer shown:', { offerId, offerType });
    
    // Here you would track offer engagement
    // this.sendOfferEngagement(offerId, 'shown');
  }

  /**
   * Example: Send analytics data to backend/service
   */
  private async sendToAnalytics(eventName: string, properties?: Record<string, any>) {
    try {
      // Example API call
      // await fetch('https://your-analytics-endpoint.com/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ event: eventName, properties })
      // });
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }
}

export default PrivacyService.getInstance();
