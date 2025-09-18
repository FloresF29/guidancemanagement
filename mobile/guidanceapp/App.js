import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Image, StyleSheet} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


import HomeScreen from './screens/Homescreen';
import SubmitScreen from './screens/Submitscreen';
import TestingScreen from './screens/Testingscreen';
import { Dimensions } from 'react-native';


const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');


function CustomHeader() {
  return (
    <View style={styles.fullHeader}>
      <View style={styles.headerContent}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>Guinayang National Highschool</Text>
      </View>
    </View>
  );
}

// ✅ This wrapper ensures gray background is behind EVERYTHING
function ScreenWrapper({ children }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
    <View style={styles.appWrapper}>
      <CustomHeader />
      {children}
    </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
     <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
      initialRouteName="Home"
        screenOptions={{
          headerShown: false, 
        }}
      >
        <Stack.Screen name="Home">
          {() => (
            <ScreenWrapper>
              <HomeScreen />
            </ScreenWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Submit">
          {() => (
            <ScreenWrapper>
              <SubmitScreen />
            </ScreenWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Test">
          {() => (
            <ScreenWrapper>
              <TestingScreen />
            </ScreenWrapper>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
  flex: 1,
  backgroundColor: '#800000', 
},
  appWrapper: {
    flex: 1,
    backgroundColor: '#800000',
  },
  fullHeader: {
    height: 100,
    backgroundColor: '#FCE7C8',
    border: 'black 2px solid',
    shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
   elevation: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.1,
    aspectRatio: 1,
    marginRight: 5,
    resizeMode: 'contain',
  },
  headerTitle: {
    color: '#C40410',
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
});
