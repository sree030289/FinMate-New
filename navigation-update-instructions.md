# Navigation Update Instructions

To integrate the new Friend Request and QR Code Scanner functionality into the FinMate app, please make the following changes to the navigation:

## 1. Update the `MainNavigator.tsx` file:

Add these imports near the other Split screen imports:
```tsx
import FriendRequestsScreen from '../screens/split/FriendRequestsScreen';
import QRCodeScannerScreen from '../screens/split/QRCodeScannerScreen';
```

In the `SplitStackNavigator` function, add these screens after the Friends screen:
```tsx
<SplitStack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Friend Requests' }} />
<SplitStack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} options={{ title: 'Scan QR Code', headerShown: false }} />
```

## 2. Usage from the FriendsScreen:
- To navigate to the FriendRequests screen: `navigation.navigate('FriendRequests')`
- To navigate to the QRCodeScanner: `navigation.navigate('QRCodeScanner')`

## 3. Update the `FriendRequestsScreen` component:
- Add a button to navigate to the QR Code Scanner: 
```tsx
<Button 
  leftIcon={<Icon as={Ionicons} name="qr-code" size="sm" />}
  onPress={() => navigation.navigate('QRCodeScanner')}
>
  Scan QR Code
</Button>
```
