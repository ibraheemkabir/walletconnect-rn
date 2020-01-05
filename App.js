import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View,Button } from 'react-native';
// import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import RNWalletConnect from "@walletconnect/react-native";

class App extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      hasPermission: null,
      barCodeResult: '',
      showCamera: false,
      type: Camera.Constants.Type.back,
      walletConnector: null 
    }  
  }
 

  async componentDidMount(){
    const { status } = await Camera.requestPermissionsAsync();
    if(status === 'granted'){
      this.setState({hasPermission: 'granted'})
    }
  }

  initWalletConnect = async (uri) => {

    try {
      const walletConnector = new RNWalletConnect(
        {uri},{
          clientMeta: {
            // Required
            description: "WalletConnect Developer App",
            url: "https://walletconnect.org",
            icons: ["https://walletconnect.org/walletconnect-logo.png"],
            name: "WalletConnect",
            ssl: true
          },
          // push: {
          //   // Optional
          //   url: "https://push.walletconnect.org",
          //   type: "fcm",
          //   token: token,
          //   peerMeta: true,
          //   language: language
          // }
        }
      );




      if (!walletConnector.connected) {
        await walletConnector.createSession()
      }

      this.subscribeToEvents();

      await this.setState({
        loading: false,
        walletConnector,
        uri: walletConnector.uri
      });      

    } catch (error) {
      throw error;
    }
  };

  
  approveSession = () => {
    const { walletConnector, chainId, address } = this.state;
    if (walletConnector) {
      walletConnector.approveSession({ chainId, accounts: [address] });
    }
    this.setState({ walletConnector });
  };

  rejectSession = () => {
    const { walletConnector } = this.state;
    if (walletConnector) {
      walletConnector.rejectSession();
    }
    this.setState({ walletConnector });
  };

  
  killSession = () => {
    const { walletConnector } = this.state;
    if (walletConnector) {
      walletConnector.killSession();
    }
    this.resetApp();
  };

  resetApp = async () => {
    await this.setState({ ...INITIAL_STATE });
    this.initWallet();
  };

  subscribeToEvents = () => {

    const {walletConnector} = this.state;

    if(walletConnector){

      walletConnector.on("session_request", (error, payload) => {
        console.log('walletConnector.on("session_request")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        const { peerMeta } = payload.params[0];
        this.setState({ peerMeta });
      });

      walletConnector.on("session_update", (error, payload) => {
        console.log('walletConnector.on("session_update")'); // tslint:disable-line

        if (error) {
          throw error;
        }
      });

      walletConnector.on("call_request", (error, payload) => {
        console.log('walletConnector.on("call_request")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        const requests = [...this.state.requests, payload];
        this.setState({ requests });
      });

      walletConnector.on("connect", (error, payload) => {
        console.log('walletConnector.on("connect")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        console.log(this.state,'connected----++')

        this.setState({ connected: true });
      });

      walletConnector.on("disconnect", (error, payload) => {
        console.log('walletConnector.on("disconnect")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        this.resetApp();
      });

      if (walletConnector.connected) {
        console.log(walletConnector.chainId,walletConnector.accounts);
        const { chainId, accounts } = walletConnector;
        console.log(chainId,accounts)
        const address = accounts[0];
        // updateWallet(address, chainId);
        this.setState({
          connected: true,
          address,
          chainId
        });    
        this.setState({ walletConnector });
      }
    }
   
   
  };
  
  

  onBarCodeScanned = (dataObject) =>{
    this.setState({showCamera: false, barCodeResult:dataObject.data})
    this.initWalletConnect(dataObject.data);
  }


  render(){
    const {hasPermission,barCodeResult,showCamera,type} = this.state;

    
    return (
      <React.Fragment>
        { hasPermission === null 
          ?
            <View />
          : hasPermission === false ?
            <Text>No access to camera</Text>
          : 
            <View style={styles.container}>
            {
              showCamera ?
              <>
                <Camera
                  onBarCodeScanned={(dataObject) => this.onBarCodeScanned(dataObject)}
                  style={styles.cameraView}
                  type={type}
                />
                <View style={styles.scanBtn}>
                  <Button
                  title="Close"
                  onPress={ () => this.setState({showCamera: false})}
                  />
                </View>
              </>
              :<Button
              title="Scan QrCode"
              onPress={ () => this.setState({showCamera: true}) }
            />
            }
              <Text>{barCodeResult !== '' ? barCodeResult : ''}</Text>
          </View>
        }
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraView: {
    width: 250,
    height: 250,
    borderRadius: 30,
  },
  scanBtn: {
    paddingTop: '5%',
    width: '50%'
  }
});

export default App;
