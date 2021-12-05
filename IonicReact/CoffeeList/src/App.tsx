import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ItemProvider } from './coffeeItems/ItemProvider';
import CoffeeList from './coffeeItems/CoffeeList';
import CoffeeEdit from './coffeeItems/CoffeeEdit';
import { AuthProvider, Login, PrivateRoute } from './auth';
import { NetworkProvider } from './network/NetworkProvider';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './network/NetworkProvider.css';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <AuthProvider>
          <NetworkProvider>
            <Route path="/login" component={Login} exact={true} />
            <ItemProvider>
              <PrivateRoute path="/coffees" component={CoffeeList} exact={true} />
              <PrivateRoute path="/coffee" component={CoffeeEdit} exact={true} />
              <PrivateRoute path="/coffee/:id" component={CoffeeEdit} exact={true} />
            </ItemProvider>
            <Route exact path="/" render={() => <Redirect to="/coffees" />} />
          </NetworkProvider>
        </AuthProvider>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
