import { useState } from "react";
import { useAuth } from "./auth/AuthContext";
import Logout from "./Logout";
import Toast from "./Toast";
import QuestionsTab from "./tabs/QuestionsTab";
import UsersTab from "./tabs/UsersTab";
import ProfileTab from "./tabs/ProfileTab";
import MatchingTab from "./tabs/MatchingTab";

export default function QuestionManager() {
    const { user, saveAuth } = useAuth();
    const isAdmin = user?.isAdmin ?? false;

    const [activeTab, setActiveTab] = useState("questions");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = (message, type = "success") => setToast({ message, type });

    return (
        <div className="app-container">
            <h1>PeerPrep</h1>

            {/* Tab row */}
            <div className="tab-row">
                <div className="tab-switcher">
                    <button
                        className={`tab-btn ${activeTab === "matching" ? "active" : ""}`}
                        onClick={() => setActiveTab("matching")}
                    >
                        Matching
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
                        onClick={() => setActiveTab("questions")}
                    >
                        Questions
                    </button>
                    {isAdmin && (
                        <button
                            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                            onClick={() => setActiveTab("users")}
                        >
                            Users
                        </button>
                    )}
                    <button
                        className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        {user?.username}
                    </button>
                </div>
                <div className="tab-actions">
                    <Logout />
                </div>
            </div>

            {/* Tab content */}
            {activeTab === "matching" && (
                <MatchingTab
                    showToast={showToast}
                    currentUser={user.id}
                    saveAuth={saveAuth}
                />
            )}
            {activeTab === "questions" && (
                <QuestionsTab
                    isAdmin={isAdmin}
                    showToast={showToast}
                />
            )}
            {activeTab === "users" && isAdmin && (
                <UsersTab
                    showToast={showToast}
                    currentUser={user}
                    saveAuth={saveAuth}
                />
            )}
            {activeTab === "profile" && <ProfileTab showToast={showToast} />}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: "", type: "success" })}
            />
        </div>
    );
}
