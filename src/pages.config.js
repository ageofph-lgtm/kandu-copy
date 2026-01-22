import AdminDashboard from './pages/AdminDashboard';
import Applications from './pages/Applications';
import Calendar from './pages/Calendar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import MyJobs from './pages/MyJobs';
import NewJob from './pages/NewJob';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import SetupProfile from './pages/SetupProfile';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Applications": Applications,
    "Calendar": Calendar,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Home": Home,
    "MyJobs": MyJobs,
    "NewJob": NewJob,
    "Notifications": Notifications,
    "Profile": Profile,
    "Scan": Scan,
    "SetupProfile": SetupProfile,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};