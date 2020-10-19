import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Link from '@material-ui/core/Link';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import authHeader from "../Utilities/auth-header";
import Axios from "axios"

import { authenticationService } from '../Services/authenticationService';
import history from '../Utilities/history';
import logo from './logo.png';
import { Avatar } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
        display: 'flex',
    },
    userDropdown: {
        marginLeft: theme.spacing(2),
        padding: theme.spacing(1),
        [theme.breakpoints.down('xs')]: {
            marginLeft: 'auto',
        },
    },
}));
function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}
const Header = () => {
    const [currentUser] = useState(authenticationService.currentUserValue);
    const [anchorEl, setAnchorEl] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [imageFile,setImageFile]=useState(null)
    const [currentUserInfo,setCurrentUserInfo]=useState(null)
    const [imageUrl,setImageUrl]=useState(null)
    const handleDropClose = () => {
        setDropdownOpen(false);
        setAnchorEl(null);
    };
    useEffect(() => {
        (async()=>{
            const config = {
                headers:authHeader()
            };
            const {data}= await Axios.get(`${process.env.REACT_APP_API_URL}/api/users/currentUser`,config)
            if(data.img){
                const base64= _arrayBufferToBase64(data.img.data.data)
                setImageUrl(base64)
            }
            
            setCurrentUserInfo(data)
        })()
    }, [])
    const handleDropOpen = event => {
        setDropdownOpen(true);
        setAnchorEl(event.currentTarget);
    };

    const handleLogout = () => {
        authenticationService.logout();
        history.push('/');
    };

    const arrowIcon = () => {
        if (dropdownOpen) {
            return <ArrowDropUpIcon />;
        }
        return <ArrowDropDownIcon />;
    };
    const classes = useStyles();
    const onFormSubmit=async(e)=>{
        e.preventDefault();

        const formData = new FormData();
        formData.append('image',imageFile);
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
                Authorization: authHeader().Authorization,
            }
        };
        console.log(imageFile)
        await Axios.post(`${process.env.REACT_APP_API_URL}/api/users/picture`,formData,config)
        handleDropClose()
        window.location.reload(false);
    }
    const onChange=(e)=> {
        setImageFile(e.target.files[0]);
    }
    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Link href="/" className={classes.title}>
                        <img src={logo} alt="Logo" />
                    </Link>
                    <Button
                        aria-owns={anchorEl ? 'simple-menu' : undefined}
                        aria-haspopup="true"
                        onClick={handleDropOpen}
                        className={classes.userDropdown}
                        color="inherit"
                    >
                        {currentUser.name}
                        {arrowIcon()}
                    </Button>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleDropClose}
                        getContentAnchorEl={null}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem style={{display:"flex",flexDirection:"column"}} > {currentUserInfo &&( currentUserInfo.img ? <Avatar src={`data:image/png;base64,${imageUrl}`} >H</Avatar> : <Avatar>H</Avatar>)}
                        <form style={{margin:"5px"}} onSubmit={onFormSubmit}>
                        <input accept="image/*" id="contained-button-file-2" type="file" name="image" onChange= {onChange} style={{display:"none"}}/>
                        <label htmlFor="contained-button-file-2">
                        <Button variant="contained" size="small" color="primary" component="span">
                            Select
                        </Button>
                        </label>
                            <Button type="submit">Save</Button>
                        </form>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
        </div>
    );
};

export default Header;
