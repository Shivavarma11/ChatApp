import { createContext, useContext, useState ,useEffect} from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from 'react-hot-toast'


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    useEffect(()=>{
        if(socket) getUsers();
    },[socket])

    const getUsers = async () => {
        try {
            const { data } = await axios.get('/api/messages/users');
            if (data?.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch users');
        }
    }

    const getMessages = async(userId)=>{
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data?.success) {
                setMessages(data.messages);
                // mark unseen count for this user as read locally
                setUnseenMessages(prev => ({ ...prev, [userId]: 0 }));
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch messages');
        }

    }

    const sendMessage = async(messageData)=>{
        try
        {
            // send messageData directly (server expects { text, image })
            const { data } = await axios.post(`/api/messages/send/${selectedUser?._id}`, messageData);
            if(data?.success){
                setMessages(prev => [...prev, data.newMessage]);
            }else{
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send message');
        }
    }

    const subscribeToMessages = () => {
        if(!socket) return;

        socket.on("newMessage",(newMessage)=>{
            const senderId = typeof newMessage.senderId === 'object' ? newMessage.senderId.toString() : newMessage.senderId;
            if(selectedUser && senderId === selectedUser._id){
                setMessages(prev => [...prev, newMessage]);
                newMessage.seen = true;
                axios.put(`/api/messages/mark/${newMessage._id}`);
                // ensure unseen count for this sender is cleared
                setUnseenMessages(prev => ({ ...prev, [senderId]: 0 }));
            }else{
                setUnseenMessages(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
            }
        })
    }

    const unsubscribeFromMessages = () => {
        if(socket){
            socket.off("newMessage");
        }
    }

    useEffect(()=>{
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        }

    },[socket, selectedUser])


    const value = {
        messages,
        setMessages,
        users,
        setUsers,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        getMessages,
        sendMessage

    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>

    )
}