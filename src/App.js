import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [prayerTimes, setPrayerTimes] = useState({});
  const [currentPrayer, setCurrentPrayer] = useState("");
  const [alarmActive, setAlarmActive] = useState(false);
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [manualTimes, setManualTimes] = useState({
    Fajr: "",
    Dhuhr: "",
    Asr: "",
    Maghrib: "",
    Isha: ""
  });

  useEffect(() => {
    fetchPrayerTimes();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const formattedTime24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const formattedHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime12 = `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
      setCurrentTime(formattedTime12);
      checkCurrentPrayer(formattedTime24);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [prayerTimes, manualTimes, alarmEnabled]);

  const fetchPrayerTimes = async () => {
    try {
      const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
        params: {
          city: 'Jamshedpur',
          country: 'India',
          method: 2
        }
      });
      setPrayerTimes(response.data.data.timings);
    } catch (error) {
      console.error("Error fetching prayer times:", error);
    }
  };

  const convertTo24HourFormat = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const checkCurrentPrayer = (currentTime) => {
    if (!alarmEnabled) return;

    const prayers = Object.entries(manualTimes).filter(([key, value]) =>
      convertTo24HourFormat(value) === currentTime
    );
    if (prayers.length > 0) {
      const [prayerName] = prayers[0];
      setCurrentPrayer(prayerName);
      setAlarmActive(true);
      playAzan();
    } else {
      setAlarmActive(false);
    }
  };

  let audioInstance = null;
  const playAzan = () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
    audioInstance = new Audio("/azan1.mp3");
    audioInstance.play();
    setNotification("It's time for " + currentPrayer);
  };

  const turnOffAlarm = () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
    setAlarmActive(false);
    setNotification(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const toggleAlarm = () => {
    setAlarmEnabled(prevState => !prevState);
    if (alarmActive) {
      turnOffAlarm();
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setManualTimes(prevTimes => ({
      ...prevTimes,
      [name]: value
    }));
  };

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  return (
    <div className="App">
      <h1>Namaz Reminder</h1>
      <div className="current-time">
        <span>Current Time: {currentTime}</span>
      </div>
      <div className="prayer-times">
        <h2>Prayer Times</h2>
        <ul>
          {Object.entries(manualTimes).map(([prayer, time]) => (
            <li key={prayer}>
              <strong>{prayer}:</strong> {time}
            </li>
          ))}
        </ul>
        <div className="manual-times">
          <h3>Set Prayer Times Manually</h3>
          {Object.keys(manualTimes).map((prayer) => (
            <div key={prayer} className="manual-time-setting">
              <label>
                {prayer}:
                <input
                  type="time"
                  name={prayer}
                  value={manualTimes[prayer]}
                  onChange={handleTimeChange}
                />
              </label>
              <span className="actual-time">
                Actual Time: {prayerTimes[prayer] || "Not Set"}
              </span>
            </div>
          ))}
        </div>
      </div>
      {notification && (
        <div className="notification">
          {notification}
          <button className="alarm-off-button" onClick={turnOffAlarm}>
            Turn Off Alarm
          </button>
        </div>
      )}
      <div className="controls">
        <button className="control-button" onClick={toggleAlarm}>
          {alarmEnabled ? "Turn Alarm Off" : "Turn Alarm On"}
        </button>
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>
    </div>
  );
}

export default App;
