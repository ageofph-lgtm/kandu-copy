import MyJobs from './pages/MyJobs';
import NewJob from './pages/NewJob';
import Scan from './pages/Scan';
import SetupProfile from './pages/SetupProfile';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Applications from './pages/Applications';
import Calendar from './pages/Calendar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "MyJobs": MyJobs,
    "NewJob": NewJob,
    "Scan": Scan,
    "SetupProfile": SetupProfile,
    "Welcome": Welcome,
    "Home": Home,
    "AdminDashboard": AdminDashboard,
    "Applications": Applications,
    "Calendar": Calendar,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Notifications": Notifications,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};