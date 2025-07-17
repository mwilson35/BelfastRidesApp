import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PrivacyService from '../services/PrivacyService';
import { colors, typography } from '../theme';

interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'promotion' | 'local_business';
}

const PersonalizedOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    // Only show offers if user consented
    if (PrivacyService.canShowPersonalizedOffers()) {
      loadPersonalizedOffers();
    }
  }, []);

  const loadPersonalizedOffers = () => {
    // Example offers - in real app, these would come from API
    const sampleOffers: Offer[] = [
      {
        id: '1',
        title: '20% off at Coffee Shop',
        description: 'Local café near your pickup location',
        type: 'local_business'
      },
      {
        id: '2', 
        title: 'Free ride on your 5th trip',
        description: 'Book 4 more rides to unlock',
        type: 'promotion'
      }
    ];

    setOffers(sampleOffers);
  };

  const handleOfferTap = (offer: Offer) => {
    // Log offer interaction
    PrivacyService.logOfferShown(offer.id, offer.type);
    
    // Track the tap event
    PrivacyService.trackEvent('offer_tapped', {
      offerId: offer.id,
      offerType: offer.type,
      offerTitle: offer.title
    });

    // Handle offer redemption/navigation here
    console.log('Offer tapped:', offer.title);
  };

  // Don't show anything if user hasn't consented to personalized content
  if (!PrivacyService.canShowPersonalizedOffers() || offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offers for You</Text>
      {offers.map((offer) => (
        <TouchableOpacity 
          key={offer.id} 
          style={styles.offerCard}
          onPress={() => handleOfferTap(offer)}
        >
          <MaterialIcons 
            name={offer.type === 'local_business' ? 'local-offer' : 'card-giftcard'} 
            size={20} 
            color={colors.primary[500]} 
          />
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerDescription}>{offer.description}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerContent: {
    flex: 1,
    marginLeft: 12,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  offerDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default PersonalizedOffers;
