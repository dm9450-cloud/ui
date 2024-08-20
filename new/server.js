const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Replace with your Bamboo credentials and plan URL
const bambooPlanUrl = 'https://your-bamboo-server/rest/api/latest/plan/YOUR_PLAN_KEY/execution';
const bambooUsername = 'your-username';
const bambooPassword = 'your-password';

app.use(express.json());

app.post('/trigger-bamboo', async (req, res) => {
    try {
        const response = await axios.post(bambooPlanUrl, {}, {
            auth: {
                username: bambooUsername,
                password: bambooPassword
            }
        });
        // Check response status or body to determine success
        if (response.status === 200) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error triggering Bamboo plan:', error);
        res.json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
