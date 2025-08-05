import React, { useState } from "react";
import { RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import lexClient from "../aws/lexConfig";
import { v4 as uuidv4 } from "uuid";

const ChatBot = () => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId] = useState(uuidv4());
  const [isMinimized, setIsMinimized] = useState(false);
  const userData = localStorage.user ? JSON.parse(localStorage.user) : null;
  const role = userData?.role || "Guest";
  const email = userData?.email || 'Guest';
  const handleSend = async () => {
    const trimmedInput = inputText.trim();

    if (trimmedInput === "" && messages.length === 0) return; // block empty first message

    const userMessage = { sender: "user", text: inputText };
    setMessages([...messages, userMessage]);

    const safeInput = trimmedInput === "" ? "skip" : trimmedInput; // Send "skip" if input is empty

    const command = new RecognizeTextCommand({
      botId: "S3MNIIWK2X",
      botAliasId: "TSTALIASID",
      localeId: "en_US",
      sessionId: sessionId,
      text: safeInput,
      sessionState: {
        sessionAttributes: {
          role: role,
          email: email,
        }
      }
    });

    try {
      console.log("Lex Command:", command);
      const response = await lexClient.send(command);
      const botMessage = {
        sender: "bot",
        text: response.messages?.[0]?.content || "No response",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Lex error:", error);
      const botMessage = {
        sender: "bot",
        text: "Sorry, something went wrong communicating with Lex.",
      };
      setMessages((prev) => [...prev, botMessage]);
    }

    setInputText("");
  };

  // ⌨️ Handle Enter key to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div style={styles.container}>
      {isMinimized ? (
        <button style={styles.minimizeButton} onClick={toggleMinimize}>
          Open Chat
        </button>
      ) : (
        <>
          <div style={styles.header}>
            <span style={styles.headerText}>ChatBot</span>
            <button style={styles.minimizeIcon} onClick={toggleMinimize}>
              −
            </button>
          </div>
          <div style={styles.chatBox}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#f1f0f0",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div style={styles.inputContainer}>
            <input
              style={styles.input}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
            />
            <button style={styles.button} onClick={handleSend}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 300,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: 8,
    boxShadow: "0px 2px 10px rgba(0,0,0,0.2)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #ccc",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  minimizeIcon: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: "0 8px",
  },
  minimizeButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    textAlign: "center",
  },
  chatBox: {
    padding: 10,
    height: 300,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  inputContainer: {
    display: "flex",
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: 10,
    border: "none",
    outline: "none",
    fontSize: 14,
  },
  button: {
    padding: "10px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  message: {
    maxWidth: "80%",
    padding: 8,
    borderRadius: 8,
    fontSize: 14,
  },
};

export default ChatBot;