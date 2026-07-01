import { getCurrentWorkerProfile } from "@/actions/profile";
import { getMyRosterOverview } from "@/actions/roster";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { AttendanceHeroStatus } from "@/components/attendance/attendance-hero-status";
import { AttendanceRosterCalendar } from "@/components/attendance/attendance-roster-calendar";
import { ScenarioSwitcher } from "@/components/attendance/scenario-switcher";
import { MiniAppTabs } from "@/components/attendance/mini-app-tabs";
import { SessionPending } from "@/components/attendance/session-pending";
import { ShiftExchangeTab } from "@/components/shift-exchange/shift-exchange-tab";
import {
  getAmITripLeader,
  getMyBusAssignments,
  getMyLedBusesWithPassengers,
} from "@/actions/shift-exchange";
import type { LedBus, MyBusInfo } from "@/types/shift-exchange";
import {
  getDummyRosterStatus,
  type ScenarioKey,
} from "@/lib/dummy-attendance";
import type { RosterStatusOverview } from "@/types/attendance";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { scenario } = await searchParams;

  // Dev mode: scenario query → force dummy
  if (scenario) {
    const { scenario: active, overview } = getDummyRosterStatus(scenario);
    return renderPage(overview, active, { isLeader: false, busInfos: [], ledBuses: [] });
  }

  // Session байхгүй бол dummy биш — хүлээлтийн spinner.
  // SessionBridge parent-аас токен авч router.refresh() хийхэд RSC дахин render
  // болж бодит дата руу шилжинэ.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SessionPending />;
  }

  // Жинхэнэ RPC + profile + shift exchange зэрэг
  const [real, profile, isLeader, busInfos, ledBuses] = await Promise.all([
    getMyRosterOverview(),
    getCurrentWorkerProfile(),
    getAmITripLeader(),
    getMyBusAssignments(),
    getMyLedBusesWithPassengers(),
  ]);

  const shiftExchangeProps = { isLeader, busInfos, ledBuses };

  if (real) {
    return renderPage(real, undefined, shiftExchangeProps);
  }

  // Session байгаа ч дата хоосон → dummy + profile fallback
  const dummy = getDummyRosterStatus(undefined);
  const overview: RosterStatusOverview = {
    ...dummy.overview,
    worker: profile ?? dummy.overview.worker,
  };
  return renderPage(overview, dummy.scenario, shiftExchangeProps);
}

function renderPage(
  overview: RosterStatusOverview,
  activeScenario: ScenarioKey | undefined,
  shiftExchange: { isLeader: boolean; busInfos: MyBusInfo[]; ledBuses: LedBus[] },
) {
  return (
    <MiniAppTabs
      attendanceSlot={
        <>
          <AttendanceHeader worker={overview.worker} />
          <AttendanceHeroStatus today={overview.today} cycle={overview.cycle} />
          <AttendanceRosterCalendar calendar={overview.calendar} />
          {activeScenario !== undefined && (
            <ScenarioSwitcher current={activeScenario} />
          )}
        </>
      }
      shiftExchangeSlot={<ShiftExchangeTab {...shiftExchange} />}
    />
  );
}
