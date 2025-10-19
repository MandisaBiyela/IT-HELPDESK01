"""Add CSS styles for paused tickets"""

css_content = """

/* ===== ICT GM ESCALATIONS - PAUSED TICKETS ===== */
.status-badge.paused {
    background: #ecf0f1;
    color: #7f8c8d;
    border: 1px solid #bdc3c7;
}

.status-badge.overdue {
    background: #fee;
    color: #c00;
    font-weight: 600;
}

.status-badge.update-required {
    background: #fff3e0;
    color: #f57c00;
    font-weight: 600;
}

.escalation-row.paused-ticket {
    background: #f8f9fa;
    border-left: 4px solid #95a5a6;
}

.escalation-row.paused-ticket:hover {
    background: #e9ecef;
}

.escalations-section {
    margin-bottom: 20px;
}

.escalations-section h3 {
    font-size: 16px;
    font-weight: 600;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
}
"""

with open('static/css/style.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("✅ Added paused ticket CSS styles to style.css")
