// src/components/Navbar/NavbarStyles.js
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
 container: {
    height: 60,                 // height of the navbar
    backgroundColor: "#b2b2f47c",    // black background
      justifyContent: "space-between", // space between logo and icon
    // justifyContent: "center",   // center vertically
    alignItems: "center",       // center horizontally
    flexDirection: "row", // arrange logo and icon horizontally
     position: "relative", 
    width: "100%",
     paddingHorizontal: 20,         // space on both sides
    paddingTop: 6,          //  some top padding
    //direction: 'ltr',     force left-to-right layout not need now.
    
     borderRadius: 10,         // rounded corners
  },
  
  logo: {
    width: 200,  // Adjust these dimensions based on your logo
    height: 50,
   // position: "absolute",          // let it float in the middle
    
    resizeMode: 'contain',  // This ensures the image scales properly
    alignSelf: 'flex-start', // Align to the start (left) of container
    marginLeft: 15, // Optional: add some left margin
  },

  icon: {
    marginRight: 15, // Optional: add some right margin
  },

  title: {
    color: "#fff",            // white text
    fontSize: 20,
    fontWeight: "bold",
  },
});


export default styles;
