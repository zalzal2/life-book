import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../store/authStore";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import CategoryListScreen from "../screens/CategoryListScreen";
import ExperienceDetailScreen from "../screens/ExperienceDetailScreen";
import MemberProfileScreen from "../screens/MemberProfileScreen";
import CreateExperienceScreen from "../screens/CreateExperienceScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import AppInfoScreen from "../screens/AppInfoScreen";
import MyActivityScreen from "../screens/MyActivityScreen";
import FriendsScreen from "../screens/FriendsScreen";
import FriendProfileScreen from "../screens/FriendProfileScreen";

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack =
  createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();

type MainStackParamList = {
  MainTabs: undefined;
  MyActivity: undefined;
  ExperienceDetail: {
    experienceId: string;
  };
  Friends: undefined;
  FriendProfile: {
    friendId: string;
  };
  MemberProfile: undefined;
  ProfileEdit: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
  AppInfo: undefined;
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={{ title: "도감" }}
      />

      <Stack.Screen
        name="ExperienceDetail"
        component={ExperienceDetailScreen}
        options={{ title: "경험 상세" }}
      />

      <Stack.Screen
        name="CreateExperience"
        component={CreateExperienceScreen}
        options={{ title: "경험 만들기" }}
      />
    </Stack.Navigator>
  );
}

function MainStackTabs() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      <MainStack.Screen
        name="MyActivity"
        component={MyActivityScreen}
        options={{ title: "내 활동" }}
      />

      <MainStack.Screen
        name="ExperienceDetail"
        component={ExperienceDetailScreen}
        options={{ title: "경험 상세" }}
      />

      <MainStack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: "친구" }}
      />

      <MainStack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ title: "친구 프로필" }}
      />

      <MainStack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{ title: "회원정보" }}
      />

      <MainStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: "프로필 수정" }}
      />

      <MainStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "비밀번호 변경" }}
      />

      <MainStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: "알림 설정" }}
      />

      <MainStack.Screen
        name="AppInfo"
        component={AppInfoScreen}
        options={{ title: "앱 정보" }}
      />
    </MainStack.Navigator>

  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: ComponentProps<typeof Ionicons>["name"];

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Categories") {
            iconName = focused ? "book" : "book-outline";
          } else {
            iconName = "ellipse";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "홈" }}
      />

      <Tab.Screen
        name="Categories"
        component={CategoryStack}
        options={{ title: "도감" }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer>
      {user ? <MainStackTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
