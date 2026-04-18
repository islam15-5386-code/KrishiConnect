import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/farmer/HomeScreen';
import ReportProblemScreen from '../screens/farmer/ReportProblemScreen';
import CropListingScreen from '../screens/farmer/CropListingScreen';
import MyOffersScreen from '../screens/farmer/MyOffersScreen';
import MarketplaceScreen from '../screens/farmer/MarketplaceScreen';
import PricesScreen from '../screens/farmer/PricesScreen';

export type FarmerTabParamList = {
  HomeTab: undefined;
  MarketplaceTab: undefined;
  MyOffersTab: undefined;
  PricesTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ReportProblem: undefined;
  CropListing: undefined;
};

const Tab = createBottomTabNavigator<FarmerTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F7F3',
    card: '#FFFFFF',
    primary: '#1D9E75',
    text: '#0F172A',
    border: '#E7ECE8',
  },
};

function FarmerTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#90A39C',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E6EFE9',
        },
        tabBarLabelStyle: {
          fontFamily: 'NotoSansBengali_500Medium',
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<string, string> = {
            HomeTab: 'home-variant',
            MarketplaceTab: 'storefront-outline',
            MyOffersTab: 'hand-coin-outline',
            PricesTab: 'chart-line',
          };
          return <MaterialCommunityIcons name={iconByRoute[route.name] as any} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'হোম' }} />
      <Tab.Screen name="MarketplaceTab" component={MarketplaceScreen} options={{ title: 'বাজার' }} />
      <Tab.Screen name="MyOffersTab" component={MyOffersScreen} options={{ title: 'অফার' }} />
      <Tab.Screen name="PricesTab" component={PricesScreen} options={{ title: 'দাম' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={FarmerTabs} />
        <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
        <Stack.Screen name="CropListing" component={CropListingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
