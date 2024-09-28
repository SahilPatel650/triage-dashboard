import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import styles from "./BedStack.module.css";

const BedComponent = ({ roomName, isActive, patientID, onBedClick }) => {
  return (
    <Card
      className={styles.bed}
      sx={{
        minWidth: 275,
        backgroundColor: isActive ? "#d1f5d3" : "#f5d1d1", // Green for active, red for inactive
        border: "1px solid #ccc", // Optional: Add a border
        marginBottom: 2, // Space between cards
      }}
    >
      <CardContent>
        <Typography variant="h5" component="div">
          {roomName}
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
          {isActive ? "Status: Available" : "Status: Occupied"}
        </Typography>
        <Typography variant="body2">
          {patientID ? `Patient ID: ${patientID}` : "No patient assigned"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onBedClick}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default BedComponent;
