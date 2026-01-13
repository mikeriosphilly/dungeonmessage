import { Link } from "react-router-dom";
import { gmStyles as styles } from "../../styles/gmStyles";

export default function GmHeader({ tableName, tableCode }) {
  return (
    <>
      <Link to="/" style={styles.back}>
        ← Home
      </Link>

      <div style={styles.headerRow}>
        <h1 style={styles.title}>{tableName || "Loading table..."}</h1>

        <div style={styles.codePill} title="Share this with players">
          <span style={styles.codeLabel}>Table code</span>
          <span style={styles.codeValue}>{tableCode}</span>
        </div>
      </div>

      <p style={styles.helper}>
        Share the code with your players. When they join, they’ll appear below.
      </p>
    </>
  );
}
