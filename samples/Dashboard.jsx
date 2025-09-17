import { Box, Typography, Button, Grid } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AssistantIcon from "@mui/icons-material/Assistant";
import LogoutIcon from "@mui/icons-material/Logout";
import AlertSnackbar from "../components/AlertSnackbar";
import Loading from "./Loading";

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

import { getChatbot_ProdConfig } from "../api/chatbot";

import Error404 from "./Error404";
import AKPI from "../components/AKPI";
import ChartStackedBar from "../components/ChartStackedBar";
import DataGridTable from "../components/DataGridTable";
import ChartBar from "../components/ChartBar";
import { getConversationsTrend } from "../api/dashboard";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";


/**
 * @module [P] Dashboard
 * @description Dashboard component that serves as the main page for the application.
 * It includes a sidebar with navigation options and a main content area.
 *
 * @returns {JSX.Element} The rendered Dashboard component.
 */
const Dashboard = () => {

  const navigate = useNavigate();

  const location = useLocation();
  const { user } = useUser();
  // for AlertSnackbar
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("success");
  
  const [chatbot, setChatbot] = useState({});
  const [sampleMessage, setSampleMessage] = useState({});

  const [loading, setLoading] = useState(true);
  const [chatbotLoading, setChatbotLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDateRange, setSelectedDateRange] = useState("7"); // Default to past 7 days

  /**
   * Logs the user out by removing authentication tokens from local storage
   * and redirecting them to the login page.
   * @function handleLogout
   */
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  /**
   * Fetches chatbot data from the backend using the provided chatbot ID.
   *
   * @async
   * @function fetchChatbot
   * @returns {Promise<void>} Resolves when the chatbot data is fetched and state is updated.
   */
  const fetchChatbot = async () => {
    const { data, error } = await getChatbot_ProdConfig(import.meta.env.VITE_CHATBOT_ID);
    if (error) {
      setAlertMessage(error);
      setSeverity("error");
      setShowAlert(true);
      setNotFound(true);
    } else {
      console.log("Chatbot Name :", data.chatbot_name);
      setChatbot(data);
    }
    setChatbotLoading(false);
  };

  const handleDateRangeChange = (event) => {
    setSelectedDateRange(event.target.value);
  };

  useEffect(() => {
    fetchChatbot();
  }, []);

  useEffect(() => {
    setLoading(chatbotLoading);
  }, [chatbotLoading]);

  useEffect(() => {
    if (location.state && location.state.showAlert) {
      setAlertMessage(location.state.message);
      setSeverity(location.state.severity);
      setShowAlert(true);
    }
  }, [location]);

  /**
   * Handles the navigate to the chatbot.
   *
   *
   */
  const handleGotoChat = (e) => {
    console.log("Control Status : ", chatbot.control);
    if(chatbot.control == 1) {
      setAlertMessage("Chatbot is currently unavailable!");
      setSeverity("error");
      setShowAlert(true);
    } else if(chatbot.control == 2) {
      navigate("/chat");
    } else {
      setNotFound(true);
    }
  };

  return loading ? (
      <Loading />
    ) : notFound ? (
      <Error404 />
    ) : (
    <Grid container sx={{ height: "100%", paddingTop: "80px" }} padding={2} spacing={5}>
      {/* Sidebar */}
      <Grid size={{ xs: 12, md: 12, lg: 2, xl: 2 }}>
        <AlertSnackbar
          alertMessage={alertMessage}
          open={showAlert}
          setOpen={setShowAlert}
          severity={severity}
        />

        <Box
          sx={{
            backgroundColor: "primary.main",
            height: "100%",
            borderRadius: 2,
            padding: "2rem",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{
            alignItems: "center",
          }}>
            <Box
              sx={{
                backgroundImage: `url(${chatbot.chatbot_logo})`,
                backgroundSize: "cover",
                height: 100,
                width: 100,
                borderRadius: "50%",
                marginBottom: 2,
              }}
            />
            <Typography variant="body1" fontWeight="bold" color="white">
              {chatbot.chatbot_name}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={1} alignItems="start">
            {/* <Button component={RouterLink} to="/chat" sx={{ color: "white" }}> */}
            <Button sx={{ color: "white" }} onClick={(e) => handleGotoChat(e)}>
              <Box display="flex" flexDirection="row" gap={1}>
                <AssistantIcon />
                <Typography variant="h6" sx={{ color: "white" }}>
                  Go to Chatbot
                </Typography>
              </Box>
            </Button>
            <Button onClick={handleLogout} sx={{ color: "white" }}>
              <Box display="flex" flexDirection="row" gap={1}>
                <LogoutIcon />
                <Typography variant="h6" sx={{ color: "white" }}>
                  Log out
                </Typography>
              </Box>
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Main Content */}
      <Grid size={{ xs: 12, md: 12, lg: 10, xl: 10 }}>
        <Box>
            <Typography
                variant="h1"
                className="welcome-title"
                color="primary.main"
                textAlign="start"
            >
              Welcome, {user.username}
            </Typography>
        </Box>
        <AKPI/>
        <Box display={"flex"} marginLeft={5}>
        <FormControl variant="standard" sx={{ minWidth: 250, marginTop: 5 }}>
          <InputLabel id="label-date">Select a date range</InputLabel>
          <Select
            labelId="label-date"
            id="data-date-range"
            value={selectedDateRange}
            label="Select a date range"
            onChange={handleDateRangeChange}
          >
            <MenuItem value={"7"}>past 7 days</MenuItem>
            <MenuItem value={"14"}>past 14 days</MenuItem>
            <MenuItem value={"30"}>past 30 days</MenuItem>
            <MenuItem value={"all"}>all time</MenuItem>
          </Select>
        </FormControl>
      </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 8 }}><ChartStackedBar selectedDateRange={selectedDateRange}/></Grid>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 4 }}><DataGridTable selectedDateRange={selectedDateRange}/></Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <ChartBar fetchData={getConversationsTrend} params={{ date_range: selectedDateRange }}/>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Typography variant="body1" gutterBottom align='justify'>
            When using AI to support your learning, remember the "<b>forgetting curve</b>" — a concept that shows how quickly we forget information without review. 
            To combat this, make the most of this AI learning assistant by actively engaging in <b><i>retrieval practice</i></b>: <b>regularly</b> ask yourself <b>different types of questions</b> about what you've learned. 
            Try getting AI to give you a quiz, give you feedback on your summary or explanation, or check your answers. This <b>strengthens your memory and deepens understanding</b> far more effectively than passively reading or copy answers from AI.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
