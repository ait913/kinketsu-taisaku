import { useState } from "react";
import { authClient } from "../api/auth";

export function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main className="login-screen">
      <section className="login-panel">
        <h1>金欠対策</h1>
        <label>
          メール
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <button onClick={async () => {
          await authClient.signIn.magicLink({ email, callbackURL: "/" });
          setSent(true);
        }}>ログインリンクを送信</button>
        <button className="secondary" onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: "/" })}>Google でログイン</button>
        {sent && <p>メールを確認してください</p>}
      </section>
    </main>
  );
}
