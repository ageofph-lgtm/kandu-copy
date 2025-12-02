import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import NewJob from './pages/NewJob';
import SetupProfile from './pages/SetupProfile';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import MyJobs from './pages/MyJobs';
import Applications from './pages/Applications';
import Scan from './pages/Scan';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Chat": Chat,
    "Profile": Profile,
    "NewJob": NewJob,
    "SetupProfile": SetupProfile,
    "Calendar": Calendar,
    "Notifications": Notifications,
    "MyJobs": MyJobs,
    "Applications": Applications,
    "Scan": Scan,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};