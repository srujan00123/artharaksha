# Notification Decorators for Artha APIs

## Overview

This document explains the notification decorator system implemented for Artha APIs. The decorators automatically send real-time notifications when API operations are successful, providing seamless integration with the frontend notification system.

## Files Created/Modified

### New Files

- `apps/artha/artha/utils/notifications.py` - Core decorator implementations
- `apps/artha/artha/utils/notification_examples.py` - Usage examples
- `apps/artha/NOTIFICATION_DECORATORS.md` - This documentation

### Modified Files

- `apps/artha/artha/api/income.py` - Added decorators to income operations
- `apps/artha/artha/api/expense.py` - Added decorators to expense operations

## Decorator Types

### 1. `@realtime_notification(event_type, **kwargs)`

Base decorator for sending custom real-time events.

**Parameters:**

- `event_type`: The event name (e.g., 'artha:income_created')
- `data_field`: Field in result to extract data from (optional)
- `user_field`: Field to extract target user (optional)
- `broadcast`: Whether to broadcast to 'all' room (default: True)
- `rooms`: List of specific rooms to notify (optional)

**Example:**

```python
@realtime_notification('artha:custom_event', data_field='event_data')
def my_function():
    return {
        "status": "success",
        "event_data": {"key": "value"}
    }
```

### 2. `@income_notification(operation, **kwargs)`

Specialized decorator for income operations.

**Operations:** 'created', 'updated', 'deleted', 'ledger_updated', 'ledger_created', 'ledger_deleted'

**Example:**

```python
@income_notification('created', data_field='income_data')
def create_income():
    return {
        "status": "success",
        "income_data": {...}
    }
```

### 3. `@expense_notification(operation, **kwargs)`

Specialized decorator for expense operations.

**Operations:** 'created', 'updated', 'deleted'

**Example:**

```python
@expense_notification('updated', data_field='expense_data')
def update_expense():
    return {
        "status": "success",
        "expense_data": {...}
    }
```

### 4. `@bulk_notification(operation, entity_type, count)`

For bulk operations affecting multiple records.

**Example:**

```python
@bulk_notification('processed', 'income', 0)
def bulk_process():
    return {
        "status": "success",
        "count": 25  # Actual count extracted from result
    }
```

### 5. `@analytics_notification(**kwargs)`

For analytics refresh operations.

### 6. `@task_notification(operation, **kwargs)`

For task progress operations.

## Usage in APIs

### Income API Functions Decorated

```python
# Create/update income sources
@realtime_notification('artha:income_saved', data_field='income_data', broadcast=True)
def create_or_update_income(...)

# Ledger operations
@income_notification('ledger_created', data_field='ledger_entry')
def create_direct_ledger_entry(...)

@income_notification('ledger_updated', data_field='ledger_entry')
def update_ledger_entry(...)

@income_notification('ledger_deleted', data_field='deleted_entry')
def delete_ledger_entry(...)

# Bulk operations
@bulk_notification('updated', 'ledger', 0)
def update_recurring_ledger_entries_for_income(...)

@income_notification('ledger_updated', data_field='entries_added')
def create_initial_recurring_entries(...)

# Analytics
@analytics_notification(broadcast=True)
def trigger_ledger_update(...)
```

### Expense API Functions Decorated

```python
# CRUD operations
@expense_notification('created', data_field='expense_data', broadcast=True)
def create_expense(...)

@expense_notification('updated', data_field='expense_data', broadcast=True)
def update_expense(...)

@expense_notification('deleted', data_field='deleted_expense', broadcast=True)
def delete_expense(...)
```

## Event Types Generated

### Income Events

- `artha:income_saved` - When income sources are created/updated
- `artha:income_ledger_created` - When ledger entries are created
- `artha:income_ledger_updated` - When ledger entries are updated
- `artha:income_ledger_deleted` - When ledger entries are deleted
- `artha:bulk_ledger_updated` - When bulk ledger updates occur
- `artha:refresh_analytics` - When analytics are refreshed

### Expense Events

- `artha:expense_created` - When expenses are created
- `artha:expense_updated` - When expenses are updated
- `artha:expense_deleted` - When expenses are deleted

## Frontend Integration

The events are automatically handled by:

- `apps/artha/realtime/handlers.js` - Socket event handlers
- Frontend notification components receive these events in real-time

## Key Features

### 1. Automatic Success Detection

Decorators only fire when the function returns `{"status": "success", ...}`

### 2. Error Resilience

If notification sending fails, the original API function still succeeds

### 3. Data Extraction

Decorators can extract specific data fields from the API response

### 4. Flexible Targeting

- Broadcast to all users
- Target specific users
- Send to specific rooms (admin, etc.)

### 5. Logging

All notifications are logged for debugging

## Required Return Format

For decorators to work properly, API functions must return:

```python
{
    "status": "success",  # Required for decorator to fire
    "data_field_name": {  # Matches decorator's data_field parameter
        # Your data here
    }
}
```

## Utility Functions

### `send_custom_notification(title, message, type, target_user, rooms)`

Send notifications programmatically without decorators.

```python
send_custom_notification(
    title="Operation Complete",
    message="Your data has been processed",
    notification_type='success',
    target_user='user@example.com'  # Optional
)
```

## Examples

See `apps/artha/artha/utils/notification_examples.py` for comprehensive usage examples.

## Testing

You can test notifications by calling any decorated API function:

1. The function executes normally
2. If successful (status="success"), a real-time event is sent
3. Frontend components receive and display the notification
4. Socket handlers relay events to appropriate rooms/users

## Benefits

1. **Consistent Notifications**: All API operations send standardized events
2. **Real-time Updates**: Frontend updates immediately when data changes
3. **Minimal Code Changes**: Just add decorators to existing functions
4. **Flexible Configuration**: Control who receives notifications and how
5. **Error Resilience**: Notification failures don't break API operations
6. **Easy Debugging**: All events are logged for troubleshooting
