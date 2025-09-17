import React, { useEffect, useState } from "react";
import {
  Typography,
  Box
} from "@mui/material";
import { useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { BarChart } from '@mui/x-charts/BarChart';

/**
 * Bar chart component allows users to view the trend of conversations over time.
 *
 * @module [C] ChartBar
 * @returns {JSX.Element} The rendered ChartBar component.
 */

const ChartBar = ({ fetchData, params = {} }) => {
    const { id } = useParams();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChartData = async (params) => {
        setLoading(true);
        const { data, error } = await fetchData(params.date_range);
        if (error) {
            console.log(error);
        } else {
            setChartData(data);
            setLoading(false);
        }
    };
    useEffect(() => {
        setLoading(true);
        if (params){
            fetchChartData(params);
        }
    }, [params]);
    
    const chartSettings = {
        yAxis: [
            {
                label: 'Number of Conversations',
                width: 80,
            },
        ],
        height: 450,
        barLabel: "value"
    };
    return (
        <Box sx={{ padding: "2rem" }}>
            <Box sx={(theme) => ({
                boxShadow: 3,
                bgcolor: '#fff',
                color: 'grey.800',
                p: 1,
                m: 1,
                borderRadius: 2,
                ...theme.applyStyles('dark', {
                    bgcolor: '#101010',
                    color: 'grey.300',
                }),
                width: '100%',
                height: 500,
            })}>
                <Typography variant="h4" color="primary.main" align="center">
                    Conversation Trend Over Time
                </Typography>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : (
                    <BarChart
                        dataset={chartData.data_result}
                        xAxis={[{ dataKey: 'x', scaleType: 'band' }]}
                        series={[{ dataKey: 'y', label: 'Number of Conversations' }]}
                        {...chartSettings}
                        loading={loading}
                    />
                )}
            </Box>
        </Box>
    );
};

export default ChartBar;