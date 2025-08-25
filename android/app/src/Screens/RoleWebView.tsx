// screens/RoleWebView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
// import { WebView } from 'react-native-webview';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './LoginScreen';

type RoleWebViewRouteProp = RouteProp<RootStackParamList, 'RoleWebView'>;

const RoleWebView: React.FC = () => {
    const route = useRoute<RoleWebViewRouteProp>();
    const { role } = route.params;

    // Map role to the correct URL path
    const rolePaths: Record<string, string> = {
        PM: '/PM',
        HR: '/HR',
        Developer: '/EMP',
        'Super Admin': '/ORGAdmin',
    };

    const path = rolePaths[role] || '/';
    const url = `http://89.116.32.31:3002${path}`;

    return (
        <View style={styles.container}>
            {/* <WebView source={{ uri: url }} /> */}
        </View>
    );
};

export default RoleWebView;

const styles = StyleSheet.create({
    container: { flex: 1 },
});
