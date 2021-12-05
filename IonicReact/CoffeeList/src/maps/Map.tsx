import { withScriptjs, withGoogleMap, GoogleMap, Marker } from 'react-google-maps';
import { compose, withProps } from 'recompose';
import { apiKey } from './apiKey';

interface MapProps {
  lat?: number;
  lng?: number;
  onMapClick: (e: any) => void,
  onMarkerClick: (e: any) => void,
  selectedLocation: (e: any) => void,
}

export const Map =
  compose<MapProps, any>(
    withProps({
      googleMapURL:
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3.exp&libraries=geometry,drawing,places`,
      loadingElement: <div style={{ height: `100%` }} />,
      containerElement: <div style={{ height: `100%` }} />,
      mapElement: <div style={{ height: `100%` }} />
    }),
    withScriptjs,
    withGoogleMap
  )(props => (
    <GoogleMap
      defaultZoom={6}
      defaultCenter={{ lat: props.lat, lng: props.lng }}
      onClick={props.onMapClick}
      mapTypeId='terrain'
    >
      <Marker
        draggable
        onDragEnd={(e: any) => props.selectedLocation(e)}
        position={{ lat: props.lat, lng: props.lng }}
        onClick={props.onMarkerClick}
      />
    </GoogleMap>
  ))
