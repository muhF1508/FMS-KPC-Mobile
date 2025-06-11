import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Import screens path
import LoginScreen from './src/screens/auth/LoginScreen.js';
import DashboardScreen from './src/screens/dashboard/DashboardScreen.js';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFD700"
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide header untuk semua screen
        }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Login Operator',
          }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            // Mencegah back navigation ke Login setelah masuk dashboard
            gestureEnabled: false,
            headerLeft: null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
