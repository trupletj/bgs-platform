export interface BusStop {
  order: number;
  directionName: string;
  zamTsag: number | null;
}

export interface TripLeaderInfo {
  name: string;
  phone: string | null;
}

export interface MyBusInfo {
  bus: {
    id: string;
    name: string;
    departureTime: string;
    capacity: number;
    direction: "arriving" | "departing";
  };
  shiftName: string | null;
  shiftDate: string | null;
  leader: TripLeaderInfo | null;
  stops: BusStop[];
  myAssignment: {
    id: string;
    isConfirmed: boolean;
    confirmedAt: string | null;
  };
}

export interface PassengerItem {
  assignmentId: string;
  userId: string;
  btegId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  departmentName: string | null;
  positionName: string | null;
  stopName: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  fromBusName: string | null;
  toBusName: string | null;
}

export interface LedBus {
  id: string;
  name: string;
  departureTime: string;
  capacity: number;
  passengers: PassengerItem[];
  transferredIn: PassengerItem[];
  transferredOut: PassengerItem[];
}

export type ConfirmResult =
  | { status: "confirmed"; name: string; stopName: string | null }
  | { status: "not_found" }
  | { status: "already"; name: string; departmentName: string | null; positionName: string | null }
  | { status: "forbidden" }
  | { status: "error"; message: string };
