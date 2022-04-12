import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Button, Image, Text, View, Platform, TouchableOpacity, TextInput, Alert, Modal, Pressable, ScrollView} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';
import { useSelector } from 'react-redux';
import Constants from "expo-constants";
import { Cloudinary } from '@cloudinary/url-gen';
import axios from 'axios';
import { getLocally, storeLocally, removeLocally } from '../../LocalStorage/index';
import  CameraRoll  from '../UploadScreen/CameraRoll';
import  Gallery  from '../UploadScreen/Gallery';
import { colorTheme1 } from '../../constants';
import FeedTemplate from '../../Templates/FeedTemplate';
import styles from '../UploadScreen/Styles';
import { CLOUDINARY_API, upload_preset } from '@env';
import { palette } from '../../Utils/ColorScheme';
import HeaderTemplate from '../../Templates/HeaderTemplate';

export default function Upload() {
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSelected, setSelection] = useState(false);
  const didMount = useRef(false);
  const [imgURL, setImgURL] = useState(null);
  const [latitude, setLatitude] = useState(undefined);
  const [longitude, setLongitude] = useState(undefined);
  const { manifest } = Constants;
  const state = useSelector(state => state);
  const userData = useSelector(state => state.user);
  // console.log('wat is ', manifest);

  const CameraAccess = () => {
    async function camera() {
      return await CameraRoll();
    }
    camera().then(() => {
      return getLocally("image");
    })
    .then((res) => {
      let img = JSON.parse(res);
      setImage(img[img.length - 1]);
      setModalVisible(!modalVisible);
    })
    .catch((err) => console.error(err));
  }

  const GalleryAccess = () => {
    async function gallery() {
        return await Gallery();
    }
    gallery().then(() => {
      return getLocally("image");
    })
    .then((res) => {
      let img = JSON.parse(res);
      setImage(img[img.length - 1]);
      return getLocally('imageGPS');
    })
    .then((gps) => {
      let gpsData = JSON.parse(gps);
      if (gpsData[0] && gpsData[1]) {
        setLatitude(gpsData[0]);
        setLongitude(-gpsData[1]);
        locationPicker(gpsData[0], -gpsData[1]);
      } else {
        if (isSelected) {
          locationPicker(undefined, undefined);
        }
      }
      setModalVisible(!modalVisible);
    })
    .catch((err) => console.error(err));
  }

  const handleUpload = (image)=>{
    const data = new FormData();
    data.append('file',image);
    data.append('upload_preset',upload_preset);

    fetch(CLOUDINARY_API,{  method:'post',body:data})
      .then(res=>res.json())
      .then(data=>{ setImgURL(data.url); })
      .catch((error) => { console.error('Error:', error); });
}

  useEffect(() => {
    if ( !didMount.current ) {
      return didMount.current = true;
    }
    // if (image !== null) {
      console.log('let mesee', image);
      let newFile = {
        uri:image,
        type:`test/${image.split(".")[1]}`,
        name:`test.${image.split(".")[1]}`
      };
    // }
    handleUpload(newFile);
    // console.log('Do something after counter has changed', newFile);
  }, [image]);

  const locationPicker = async (latitudeCord, longitudeCord) => {
    // if (isSelected === true) {
      // cosole.log('isSelected', isSelected);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      // setSelection(true);

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });

      let gps = await Location.reverseGeocodeAsync({
        latitude : latitude === undefined ? location.coords.latitude : latitudeCord,
        longitude : longitude === undefined ? location.coords.longitude : longitudeCord,
      })
      setLocation(gps[0].city + ', ' + gps[0].region);
      // console.log('we have city', gps[0].city, '    ', gps[0].region);
    // }
  }

  const postData = () => {
    let uploadInfo = {};
    uploadInfo['url'] = imgURL;
    uploadInfo['caption'] = text.text;
    if (isSelected) {
      if (location === "null, null") {
        uploadInfo['location'] = null;
      } else {
        uploadInfo['location'] = location;
      }
    } else {
      uploadInfo['location'] = null;
    }
    uploadInfo['username'] = "joe";
    uploadInfo['profPhoto'] = "Joe's profile photo";
    fetch('http://44.201.208.58:3000/post/uploadPost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadInfo),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      removeLocally("image");
      removeLocally("imageGPS");
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  return (
    <ScrollView style={[
      styles.centeredView,
      {
        backgroundColor: palette(state.theme).pageColor,
      }
    ]}>
      <HeaderTemplate userData={null} showUserDisplay={true}></HeaderTemplate>
      <View style={styles.container}>
        <Text style={[
          styles.header,
          {
            color: palette(state.theme).buttonText
          }
        ]}> Post Your Pets</Text>
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: palette(state.theme).buttonColor,
              borderColor: palette(state.theme).buttonBorderColor,
            }
          ]}
          onPress={() => setModalVisible(true)}>
          {image === null ? <FontAwesome name="image" style={[styles.icon, {color: palette(state.theme).iconColor}]} size={100} />
            : <Image source={{ uri: image }} style={{ width: 300, height: 200, borderColor: palette(state.theme).buttonBorderColor, borderWidth: 1 }} />}
        </Pressable>
        <Text style={[
          styles.caption,
          {
            color: palette(state.theme).buttonText
          }
        ]}>Caption </Text>
        <TextInput
          style={[
            styles.inputBox,
            {
              borderColor: palette(state.theme).buttonBorderColor,
            }
          ]}
          placeholder="Say something about your pet!"
          onChangeText={(text) => setText({ text })}
          multiline={true}
        />
        <View style={styles.checkBoxSection}>
          <Checkbox
            value={isSelected}
            onValueChange={() => {
                                    setSelection(!isSelected);
                                    locationPicker(latitude, longitude);
                                  }
                          }
            style={[
              styles.checkbox,
              {
                backgroundColor: palette(state.theme).iconColor
              }
            ]}
            color={isSelected? '#4630EB' : undefined}
          />
          <Text style={styles.locationCaption}>Share Location</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: palette(state.theme).buttonColor,
              borderColor: palette(state.theme).buttonBorderColor
            }
          ]}
          // onPress={() => navigate('HomeScreen')}
          onPress={() => postData()}
          underlayColor='#fff'>
          <Text style={[
            styles.post,
            {
              color: palette(state.theme).iconColor
            }
          ]}>Post</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        style={styles.selectorButton}
        visible={modalVisible}
        onRequestClose={
          () => {
            setModalVisible(!modalVisible);
          }
        }
      >
        <View style={styles.centeredView}>
          <View style={[
            styles.modalView,
            {
              shadowColor: palette(state.theme).shadowColor,
              backgroundColor: palette(state.theme).pageColor,
            }
          ]}>
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: palette(state.theme).buttonColor,
                  borderColor: palette(state.theme).buttonBorderColor,
                  shadowColor: palette(state.theme).shadowColor
                }
              ]}
              onPress={() => {GalleryAccess()}}
            >
            <Text style={[
              styles.textStyle,
              {
                color: palette(state.theme).buttonText
              }
            ]}>Pick From Photos Gallary</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: palette(state.theme).buttonColor,
                  borderColor: palette(state.theme).buttonBorderColor,
                  shadowColor: palette(state.theme).shadowColor,
                }
              ]}
              onPress={() => {CameraAccess()}}
            >
            <Text style={[
              styles.textStyle,
              {
                color: palette(state.theme).buttonText
              }
            ]}>Pick From Camera roll</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
