import RegisterPage from '../pages/register/register-page';
import LoginPage from '../pages/login/login-page';
import HomePage from '../pages/home/home-page';
import StoryDetailPage from '../pages/detail/detail-page';
import CreatePage from '../pages/create/create-page';
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth';
import BookmarkPage from '../pages/bookmark/bookmark-page';
import NotFound from '../pages/notfound/notfound-page';

const routes = {
  '/login': () => checkUnauthenticatedRouteOnly(new LoginPage()),
  '/register': () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  '/': () => checkAuthenticatedRoute(new HomePage()),
  '/story/:id': () => checkAuthenticatedRoute(new StoryDetailPage()),
  '/create': () => checkAuthenticatedRoute(new CreatePage()),
  '/bookmark': () => checkAuthenticatedRoute(new BookmarkPage()),
  '/not-found': () => checkAuthenticatedRoute(new NotFound())
};

export default routes;
