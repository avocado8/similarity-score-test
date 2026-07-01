import { useEffect, useState } from "react";
import { DrawingGame } from "./components/DrawingGame";
import { DataPreview } from "./components/DataPreview";
import { LabPage } from "./lab/LabPage";
import { SubmissionPage } from "./components/SubmissionPage";
import { AdminReviewPage } from "./components/AdminReviewPage";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

type View = "submission" | "admin" | "game" | "preview" | "lab";

function App() {
  const [view, setView] = useState<View>("submission");
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session ?? null);
      setAuthLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncView = (nextView: View) => {
    setView(nextView);
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    setSession(data.session);
    setAuthLoading(false);
    setView("admin");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView("submission");
  };

  const isAuthenticated = Boolean(session);

  const renderAdminNavigation = () => (
    <div
      style={{
        padding: "10px 20px",
        borderBottom: "1px solid #ddd",
        background: "#f7f9fc",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => syncView("admin")}
        style={{
          fontWeight: view === "admin" ? "bold" : "normal",
          padding: "8px 16px",
          backgroundColor: view === "admin" ? "#2196F3" : "white",
          color: view === "admin" ? "white" : "black",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        검수 관리
      </button>
      <button
        onClick={() => syncView("game")}
        style={{
          fontWeight: view === "game" ? "bold" : "normal",
          padding: "8px 16px",
          backgroundColor: view === "game" ? "#2196F3" : "white",
          color: view === "game" ? "white" : "black",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        게임
      </button>
      <button
        onClick={() => syncView("preview")}
        style={{
          fontWeight: view === "preview" ? "bold" : "normal",
          padding: "8px 16px",
          backgroundColor: view === "preview" ? "#2196F3" : "white",
          color: view === "preview" ? "white" : "black",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        데이터 미리보기
      </button>
      <button
        onClick={() => syncView("lab")}
        style={{
          fontWeight: view === "lab" ? "bold" : "normal",
          padding: "8px 16px",
          backgroundColor: view === "lab" ? "#2196F3" : "white",
          color: view === "lab" ? "white" : "black",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        실험실
      </button>
      <button
        onClick={handleSignOut}
        style={{
          marginLeft: "auto",
          padding: "8px 16px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        로그아웃
      </button>
    </div>
  );

  const renderLoginForm = () => (
    <div
      style={{
        maxWidth: "420px",
        margin: "40px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        backgroundColor: "white",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.06)",
      }}
    >
      <h2 style={{ marginBottom: "16px" }}>관리자 로그인</h2>
      <label
        style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}
      >
        이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{
            width: "100%",
            maxWidth: "100%",
            marginTop: "6px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
          placeholder="admin@example.com"
        />
      </label>
      <label
        style={{ display: "block", marginBottom: "16px", fontSize: "14px" }}
      >
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            width: "100%",
            maxWidth: "100%",
            marginTop: "6px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
          placeholder="••••••••"
        />
      </label>
      {authError && (
        <div
          style={{
            marginBottom: "16px",
            color: "#c62828",
            fontSize: "14px",
          }}
        >
          {authError}
        </div>
      )}
      <button
        onClick={handleSignIn}
        disabled={authLoading}
        style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: authLoading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        {authLoading ? "로그인 중..." : "관리자 로그인"}
      </button>
      <p style={{ marginTop: "16px", fontSize: "13px", color: "#666" }}>
        내부 관리자용 계정으로 로그인하세요.
      </p>
    </div>
  );

  return (
    <>
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #ddd",
          background: "#f9f9f9",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => syncView("submission")}
          style={{
            fontWeight: view === "submission" ? "bold" : "normal",
            padding: "8px 16px",
            backgroundColor: view === "submission" ? "#2196F3" : "white",
            color: view === "submission" ? "white" : "black",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          그림 제출
        </button>
        {isAuthenticated ? (
          <button
            onClick={() => syncView("admin")}
            style={{
              fontWeight: view === "admin" ? "bold" : "normal",
              padding: "8px 16px",
              backgroundColor: view === "admin" ? "#333" : "white",
              color: view === "admin" ? "white" : "black",
              border: "1px solid #333",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            관리자 페이지
          </button>
        ) : (
          <button
            onClick={() => syncView("admin")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #333",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            관리자 로그인
          </button>
        )}
      </div>

      {isAuthenticated && renderAdminNavigation()}

      {view === "submission" && <SubmissionPage />}
      {!isAuthenticated &&
        view === "admin" &&
        (authLoading ? null : renderLoginForm())}
      {isAuthenticated && view === "admin" && <AdminReviewPage />}
      {isAuthenticated && view === "game" && <DrawingGame />}
      {isAuthenticated && view === "preview" && <DataPreview />}
      {isAuthenticated && view === "lab" && <LabPage />}

      {!isAuthenticated && view !== "submission" && view !== "admin" && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#666",
          }}
        >
          관리자 인증이 필요합니다. 관리자 로그인을 먼저 해주세요.
        </div>
      )}
    </>
  );
}

export default App;
