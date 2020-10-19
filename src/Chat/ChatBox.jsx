import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Paper from '@material-ui/core/Paper';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import AttachmentIcon from '@material-ui/icons/Attachment';
import socketIOClient from 'socket.io-client';
import Picker from 'emoji-picker-react';
import CircularProgress from '@material-ui/core/CircularProgress';
import path from "path"
import {
    useGetGlobalMessages,
    useSendGlobalMessage,
    useGetConversationMessages,
    useSendConversationMessage,
} from '../Services/chatService';
import { authenticationService } from '../Services/authenticationService';
import Axios from 'axios';
import authHeader from '../Utilities/auth-header';
import DescriptionIcon from '@material-ui/icons/Description';
import { Link } from '@material-ui/core';
import { async } from 'rxjs/internal/scheduler/async';
const useStyles = makeStyles(theme => ({
    root: {
        height: '100%',
    },
    headerRow: {
        maxHeight: 60,
        zIndex: 5,
    },
    paper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: theme.palette.primary.dark,
    },
    messageContainer: {
        height: '100%',
    },
    messagesRow: {
        maxHeight: '70vh',
        overflowY: 'auto',
    },
    newMessageRow: {
        width: '100%',
        padding: theme.spacing(0, 2, 1),
    },
    inputRow: {
        display: 'flex',
        alignItems: 'flex-end',
    },
    form: {
        width: '100%',
    },
    avatar: {
        margin: theme.spacing(1, 1.5),
    },
    listItem: {
        width: '80%',
    },
    listMyMessage:{
        flexGrow:"0",
        marginLeft:"auto"
    }
}));

const ChatBox = props => {
    const [newMessage, setNewMessage] = useState('');
    const [submitting,setSubmitting]=useState(false)
    const onEmojiClick=(e,emojiObject)=>{
        console.log("event",e)
        console.log("emojiObject",emojiObject)
        setNewMessage(newMessage.concat(emojiObject.emoji))
    }
    const [messages, setMessages] = useState([]);
    const [lastMessage, setLastMessage] = useState(null);
    const [openPicker,setOpenPicker]=useState(false)
    const [currentUser,setCurrentUser]=useState(null)
    const [file,setFile]=useState(null)
    const getGlobalMessages = useGetGlobalMessages();
    const sendGlobalMessage = useSendGlobalMessage();
    const getConversationMessages = useGetConversationMessages();
    const sendConversationMessage = useSendConversationMessage();
    let chatBottom = useRef(null);
    const classes = useStyles();
    const toggleEmojiPicker=()=>{
        setOpenPicker(!openPicker)
    }
    useEffect(()=>{
        (async()=>{
            const config = {
                headers: authHeader()
            };
            const {data}=await Axios.get(`${process.env.REACT_APP_API_URL}/api/users/currentUser`,config)
            setCurrentUser(data)
        })()
    },[])
    useEffect(() => {
        reloadMessages();
        scrollToBottom();
    }, [lastMessage, props.scope, props.conversationId]);

    useEffect(() => {
        const socket = socketIOClient(process.env.REACT_APP_API_URL);
        socket.on('messages', data => setLastMessage(data));
    }, []);

    const reloadMessages = () => {
        if (props.scope === 'Global Chat') {
            getGlobalMessages().then(res => {
                setMessages(res);
            });
        } else if (props.scope !== null && props.conversationId !== null) {
            getConversationMessages(props.user._id).then(res =>
                setMessages(res)
            );
        } else {
            setMessages([]);
        }
    };

    const scrollToBottom = () => {
        chatBottom.current.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    const handleFileChange=(e)=>{
        setFile(e.target.files[0])
    }
    const handleSubmit = async(e) => {
        e.preventDefault();
        if(newMessage.length===0){
            return
        }
        setSubmitting(true)

        if (props.scope === 'Global Chat') {
            let filePath=null
            if(file){
                const newFile=await uploadFile()
                filePath=newFile.path
            }
            sendGlobalMessage({message:newMessage,file:filePath}).then(() => {
                setNewMessage('');
            });
        } else {
            let filePath=null
            if(file){
                const newFile=await uploadFile()
                filePath=newFile.path
            }
            sendConversationMessage(props.user._id, {message:newMessage,file:filePath}).then(res => {
                setNewMessage('');
            });
        }
        setSubmitting(false)
        setFile(null)
    };
    const uploadFile=async()=>{
        try {
            const formData = new FormData();
        formData.append('file',file);
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
                Authorization: authHeader().Authorization,
            }
        };
        const {data}=await Axios.post(`${process.env.REACT_APP_API_URL}/api/messages/file`,formData,config)
        return data
        } catch (error) {
            return error
        }
        
    }
    return (
        <Grid container className={classes.root}>
            <Grid item xs={12} className={classes.headerRow}>
                <Paper className={classes.paper} square elevation={2}>
                    <Typography color="inherit" variant="h6">
                        {props.scope}
                    </Typography>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <Grid container className={classes.messageContainer}>
                    <Grid item xs={12} className={classes.messagesRow}>
                        {messages && (
                            <List>
                                {messages.map(m=>{
                                    return ((currentUser && m.fromObj[0]._id===currentUser._id)?
                                        (<ListItem
                                            key={m._id}
                                            className={`${classes.listItem} ${classes.listMyMessage}`}
                                        >
                                            
                                            <ListItemText
                                                primary={m.fromObj[0].name}
                                                secondary={
                                                    <div>
                                                        
                                                        
                                                        {m.body.file && (
                                                        <Link href={process.env.REACT_APP_API_URL+m.body.file.slice(7,m.body.file.length)} download={m.body.message+path.extname(m.body.file)}>
                                                            <DescriptionIcon fontSize="large" />
                                                        </Link>)}
                                                        {m.body.message}
                                                    </div>
                                                }
                                                className={classes.listMyMessage}
                                            />
                                            <ListItemAvatar
                                                className={classes.avatar}
                                            >
                                                {m.fromObj[0].img ? <Avatar src={`data:image/png;base64,${m.fromObj[0].img.data}`} >H</Avatar> : <Avatar>H</Avatar>}
                                            </ListItemAvatar>
                                        </ListItem>)
                                    :
                                        (<ListItem
                                        key={m._id}
                                        className={classes.listItem}
                                        alignItems="flex-start"
                                    >
                                        <ListItemAvatar
                                            className={classes.avatar}
                                        >
                                            {m.fromObj[0].img ? <Avatar src={`data:image/png;base64,${m.fromObj[0].img.data}`} >H</Avatar> : <Avatar>H</Avatar>}
                                            
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={m.fromObj[0].name}
                                            secondary={
                                                <div>
                                                        
                                                        
                                                        {m.body.file && (
                                                        <Link href={process.env.REACT_APP_API_URL+m.body.file.slice(7,m.body.file.length)} download={m.body.message+path.extname(m.body.file)}>
                                                            <DescriptionIcon fontSize="large" />
                                                        </Link>)}
                                                        {m.body.message}
                                                    </div>
                                            }
                                        />
                                    </ListItem>))
                                })}
                            </List>
                        )}
                        <div ref={chatBottom} />
                    </Grid>
                    <div style={{position:"absolute",bottom:"70px",right:"0",display:"flex",justifyContent:"center"}}>
                            {openPicker&& <Picker onEmojiClick={onEmojiClick} /> }

                            </div>
                    <Grid item xs={12} className={classes.inputRow}>
                        <form onSubmit={handleSubmit} className={classes.form}>
                            <Grid
                                container
                                className={classes.newMessageRow}
                                alignItems="flex-end"
                            >
                                <Grid item xs={9}>
                                    <TextField
                                        id="message"
                                        label="Message"
                                        variant="outlined"
                                        margin="dense"
                                        name="message"
                                        fullWidth
                                        value={newMessage}
                                        onChange={e =>
                                            setNewMessage(e.target.value)
                                        }
                                    />
                                </Grid>
                                <Grid item xs={1}>
                                    <input onChange={handleFileChange} style={{display:"none"}} id="contained-button-file" name="file" type="file" />
                                    <label htmlFor="contained-button-file">
                                    <IconButton component="span"> 
                                        <AttachmentIcon color={file?"primary":"inherit"} />
                                    </IconButton>
                                    </label>
                                </Grid>
                                <Grid item xs={1}>
                                <IconButton onClick={toggleEmojiPicker}>
                                        <InsertEmoticonIcon color={openPicker?"primary":"inherit"} />
                                    </IconButton>
                                </Grid>
                                <Grid item xs={1}>
                                    <IconButton type="submit">
                                        {submitting? <CircularProgress fontSize="small" /> :<SendIcon />}
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ChatBox;
