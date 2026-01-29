## ERD cho feature parking-map

Dưới đây là sơ đồ ER (Mermaid) mô tả các thực thể chính liên quan đến chức năng bản đồ bãi đỗ (parking-map), gồm quan hệ giữa `User`, `Vehicle`, `Booking`, `FloorLayout`, `ParkingSlot`, `ParkingCell`, `EntryPoint` và `ExitPoint`.

```mermaid
erDiagram
    USER {
      string id PK
      string name
      string email
      string phone
    }

    VEHICLE {
      string id PK
      string userId FK
      string licensePlate
      string type
      boolean isDefault
    }

    BOOKING {
      string id PK
      string userId FK
      string slotId FK
      string vehicleId FK
      datetime startTime
      datetime endTime
      string status
    }

    FLOOR_LAYOUT {
      int id PK
      int floor
      int width
      int height
    }

    PARKING_CELL {
      int x
      int y
      string type
      boolean walkable
    }

    PARKING_SLOT {
      string id PK
      string code
      int floor
      string status
      string reservedBy FK
      datetime reservedUntil
      string features
    }

    ENTRY_POINT {
      string id PK
      string name
      int floor
      int x
      int y
    }

    EXIT_POINT {
      string id PK
      string name
      int floor
      int x
      int y
    }

    USER ||--o{ VEHICLE : "owns"
    USER ||--o{ BOOKING : "makes"
    VEHICLE ||--o{ BOOKING : "used_in"
    PARKING_SLOT ||--o{ BOOKING : "booked"

    FLOOR_LAYOUT ||--o{ PARKING_CELL : "contains"
    FLOOR_LAYOUT ||--o{ PARKING_SLOT : "contains"
    FLOOR_LAYOUT ||--o{ ENTRY_POINT : "has"
    FLOOR_LAYOUT ||--o{ EXIT_POINT : "has"

    PARKING_CELL ||--|{ PARKING_SLOT : "specializes"

    %% Ghi chú: NavigationRoute và các đường dẫn được sinh động (generated) từ FloorLayout và không nhất thiết lưu dưới dạng bảng lâu dài.
```

Ghi chú ngắn:
- `Booking` liên kết `User`, `Vehicle` và `ParkingSlot` (thực tế trong code là `slotId`, `userId`, `vehicleId`).
- `FloorLayout` chứa `ParkingCell` (mỗi ô trên lưới) và `ParkingSlot` (các ô có `CellType.SLOT`).
- `EntryPoint` / `ExitPoint` là các loại `ParkingCell` đặc biệt và liên kết với `FloorLayout` bằng thuộc tính `floor`.
- Cập nhật trạng thái chỗ đỗ được nhận qua MQTT (`SlotUpdateMessage`) và có thể cập nhật thực thể `ParkingSlot.status` hoặc tạo log sự kiện riêng.

File này lưu ở: src/features/parking-map/ERD.md
