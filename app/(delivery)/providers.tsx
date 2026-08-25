import { ProvidersList } from '../(kiosko)/providers';
import { Colors } from '@/theme';

export default function DeliveryProvidersScreen() {
  return <ProvidersList businessId="delivery" accentColor={Colors.azulInstitucional} />;
}
