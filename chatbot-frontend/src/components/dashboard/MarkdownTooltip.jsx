import React from 'react';
import { Tooltip, styled } from '@mui/material';
import ReactMarkdown from 'react-markdown';

// Custom styled tooltip with larger font and markdown support
const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    '& .MuiTooltip-tooltip': {
        backgroundColor: '#ffffff',
        color: '#333',
        maxWidth: 400,
        fontSize: '0.95rem',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '1rem',
        '& h3': {
            margin: '0 0 0.5rem 0',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#1976d2'
        },
        '& h4': {
            margin: '0.75rem 0 0.25rem 0',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#555'
        },
        '& p': {
            margin: '0.25rem 0',
            lineHeight: 1.6
        },
        '& ul': {
            margin: '0.25rem 0',
            paddingLeft: '1.25rem'
        },
        '& li': {
            margin: '0.25rem 0',
            lineHeight: 1.5
        },
        '& strong': {
            fontWeight: 600,
            color: '#1976d2'
        }
    },
    '& .MuiTooltip-arrow': {
        color: '#ffffff',
        '&::before': {
            border: '1px solid #e0e0e0',
        }
    }
}));

export default function MarkdownTooltip({ title, children, ...props }) {
    return (
        <CustomTooltip
            title={
                <ReactMarkdown>
                    {title}
                </ReactMarkdown>
            }
            placement="right"
            arrow
            enterDelay={200}
            leaveDelay={200}
            {...props}
        >
            {children}
        </CustomTooltip>
    );
}
