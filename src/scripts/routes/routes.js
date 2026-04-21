import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import MapPage from '../pages/map/map-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import FavoritePage from '../pages/favorite/favorite-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/map': new MapPage(),
  '/add-story': new AddStoryPage(),
  '/favorites': new FavoritePage(),
};

export default routes;
