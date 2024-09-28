// src/components/BedStack.js
import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './BedStack.module.css';

const BedStack = ({ onBedClick }) => {
  return (
    <div className={styles.bedStack}>
      {[...Array(5)].map((_, index) => (
        <Card 
          key={index} 
          className={styles.bed} 
          sx={{ 
            minWidth: 275, 
            backgroundColor: '#f0f0f0', // Light grey background color
            border: '1px solid #ccc', // Optional: Add a border
            marginBottom: 2, // Space between cards
          }}
        >
          <CardContent>
            <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
              Bed {index + 1}
            </Typography>
            <Typography variant="h5" component="div">
              Patient Info
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Status: Available</Typography>
            <Typography variant="body2">
              Details about the bed and patient status can go here.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => onBedClick(index + 1)}>View Details</Button>
          </CardActions>
        </Card>
      ))}
    </div>
  );
};

export default BedStack;
