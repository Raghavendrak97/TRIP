import { and, asc, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateEnquiryBody,
  CreateEnquiryResponse,
  CreateTripBody,
  CreateTripResponse,
  GetDashboardSummaryResponse,
  GetOperatorParams,
  GetOperatorResponse,
  GetTripParams,
  GetTripResponse,
  GetTripRouteParams,
  GetTripRouteResponse,
  ListOperatorsQueryParams,
  ListOperatorsResponse,
  ListTripsResponse,
  MatchOperatorsQueryParams,
  MatchOperatorsResponse,
} from "@workspace/api-zod";
import {
  db,
  enquiriesTable,
  operatorVehiclesTable,
  operatorsTable,
  tripDestinationsTable,
  tripsTable,
} from "@workspace/db";
import { calculateRoute } from "../lib/route-service";

const router: IRouter = Router();

type DbTrip = typeof tripsTable.$inferSelect;
type DbDestination = typeof tripDestinationsTable.$inferSelect;
type DbOperator = typeof operatorsTable.$inferSelect;
type DbVehicle = typeof operatorVehiclesTable.$inferSelect;

function calendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatTrip(trip: DbTrip, destinations: DbDestination[]) {
  return {
    id: String(trip.id),
    startLocation: trip.startLocation,
    startDate: trip.startDate,
    endDate: trip.endDate,
    passengerCount: trip.passengerCount,
    vehicleType: trip.vehicleType,
    tripType: trip.tripType,
    specialRequirements: trip.specialRequirements,
    destinations: destinations
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map((destination) => ({
        id: String(destination.id),
        sequenceOrder: destination.sequenceOrder,
        destinationName: destination.destinationName,
        stayDays: destination.stayDays,
        roamingRadiusKm: destination.roamingRadiusKm,
        notes: destination.notes,
      })),
    status: trip.status,
    totalRouteDistanceKm: trip.totalRouteDistanceKm ?? undefined,
    estimatedDriveTime: trip.estimatedDriveTime ?? undefined,
    createdAt: trip.createdAt.toISOString(),
  };
}

async function getTripWithDestinations(id: number) {
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, id));
  if (!trip) return null;
  const destinations = await db
    .select()
    .from(tripDestinationsTable)
    .where(eq(tripDestinationsTable.tripId, id))
    .orderBy(asc(tripDestinationsTable.sequenceOrder));
  return { trip, destinations };
}

async function getOperatorWithVehicles(id: number) {
  const [operator] = await db.select().from(operatorsTable).where(eq(operatorsTable.id, id));
  if (!operator) return null;
  const vehicles = await db
    .select()
    .from(operatorVehiclesTable)
    .where(eq(operatorVehiclesTable.operatorId, id));
  return { operator, vehicles };
}

function formatOperator(operator: DbOperator, vehicles: DbVehicle[]) {
  return {
    id: String(operator.id),
    businessName: operator.businessName,
    operatorType: operator.operatorType,
    description: operator.description,
    city: operator.city,
    state: operator.state,
    yearsExperience: operator.yearsExperience,
    verificationStatus: operator.verificationStatus,
    rating: operator.rating / 10,
    totalReviews: operator.totalReviews,
    maxTripDistanceKm: operator.maxTripDistanceKm,
    maxTripDurationDays: operator.maxTripDurationDays,
    roamingCapabilityKm: operator.roamingCapabilityKm,
    vehicles: vehicles.map((vehicle) => ({
      type: vehicle.type,
      label: vehicle.label,
      seats: vehicle.seats,
      ac: vehicle.ac,
    })),
    serviceAreas: operator.serviceAreas,
    preferredDestinations: operator.preferredDestinations,
    tripTypes: operator.tripTypes,
    phone: operator.phone,
    whatsapp: operator.whatsapp,
  };
}

async function listFormattedOperators() {
  const operators = await db.select().from(operatorsTable).orderBy(desc(operatorsTable.rating));
  return Promise.all(
    operators.map(async (operator) => {
      const vehicles = await db
        .select()
        .from(operatorVehiclesTable)
        .where(eq(operatorVehiclesTable.operatorId, operator.id));
      return { operator, vehicles, formatted: formatOperator(operator, vehicles) };
    }),
  );
}

router.get("/trips", async (_req, res): Promise<void> => {
  const trips = await db.select().from(tripsTable).orderBy(desc(tripsTable.createdAt));
  const formatted = await Promise.all(
    trips.map(async (trip) => {
      const destinations = await db
        .select()
        .from(tripDestinationsTable)
        .where(eq(tripDestinationsTable.tripId, trip.id))
        .orderBy(asc(tripDestinationsTable.sequenceOrder));
      return formatTrip(trip, destinations);
    }),
  );
  res.json(ListTripsResponse.parse(formatted));
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const route = calculateRoute(parsed.data.startLocation, parsed.data.destinations);
  const [trip] = await db
    .insert(tripsTable)
    .values({
      startLocation: parsed.data.startLocation,
      startDate: calendarDate(parsed.data.startDate),
      endDate: calendarDate(parsed.data.endDate),
      passengerCount: parsed.data.passengerCount,
      vehicleType: parsed.data.vehicleType,
      tripType: parsed.data.tripType,
      specialRequirements: parsed.data.specialRequirements ?? "",
      totalRouteDistanceKm: route.totalDistanceKm,
      estimatedDriveTime: route.totalDrivingTime,
    })
    .returning();
  if (!trip) {
    res.status(500).json({ error: "Unable to create trip" });
    return;
  }

  const destinations = await db
    .insert(tripDestinationsTable)
    .values(
      parsed.data.destinations.map((destination, index) => ({
        tripId: trip.id,
        sequenceOrder: index + 1,
        destinationName: destination.destinationName,
        stayDays: destination.stayDays,
        roamingRadiusKm: destination.roamingRadiusKm,
        notes: destination.notes ?? "",
      })),
    )
    .returning();
  res.status(201).json(CreateTripResponse.parse(formatTrip(trip, destinations)));
});

router.get("/trips/:tripId", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await getTripWithDestinations(Number(params.data.tripId));
  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(GetTripResponse.parse(formatTrip(result.trip, result.destinations)));
});

router.get("/trips/:tripId/route", async (req, res): Promise<void> => {
  const params = GetTripRouteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await getTripWithDestinations(Number(params.data.tripId));
  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  const route = calculateRoute(result.trip.startLocation, result.destinations);
  res.json(
    GetTripRouteResponse.parse({
      tripId: String(result.trip.id),
      totalDistanceKm: route.totalDistanceKm,
      totalDrivingTime: route.totalDrivingTime,
      legs: route.legs,
    }),
  );
});

router.get("/operators", async (req, res): Promise<void> => {
  const params = ListOperatorsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const operators = await listFormattedOperators();
  res.json(ListOperatorsResponse.parse(operators.map(({ formatted }) => formatted)));
});

router.get("/operators/:operatorId", async (req, res): Promise<void> => {
  const params = GetOperatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await getOperatorWithVehicles(Number(params.data.operatorId));
  if (!result) {
    res.status(404).json({ error: "Operator not found" });
    return;
  }
  res.json(GetOperatorResponse.parse(formatOperator(result.operator, result.vehicles)));
});

router.get("/matching/operators", async (req, res): Promise<void> => {
  const params = MatchOperatorsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tripResult = await getTripWithDestinations(Number(params.data.tripId));
  if (!tripResult) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  const route = calculateRoute(tripResult.trip.startLocation, tripResult.destinations);
  const maxRoaming = Math.max(...tripResult.destinations.map((destination) => destination.roamingRadiusKm));
  const destinationNames = tripResult.destinations.map((destination) => destination.destinationName.toLowerCase());
  const operators = await listFormattedOperators();
  const matches = operators
    .map(({ operator, vehicles, formatted }) => {
      let score = 0;
      const reasons: string[] = [];
      const specialist = operator.preferredDestinations.some((destination) =>
        destinationNames.includes(destination.toLowerCase()),
      );
      const broadService = operator.serviceAreas.some(
        (area) => area.toLowerCase() === "all india" || destinationNames.includes(area.toLowerCase()),
      );
      const vehicleMatch = vehicles.some((vehicle) => vehicle.type === tripResult.trip.vehicleType);
      const capacityMatch = vehicles.some((vehicle) => vehicle.seats >= tripResult.trip.passengerCount);
      const tripTypeMatch = operator.tripTypes.some(
        (tripType) => tripType.toLowerCase() === tripResult.trip.tripType.toLowerCase(),
      );

      if (specialist) {
        score += 30;
        reasons.push(`${tripResult.destinations[0]?.destinationName} specialist`);
      } else if (broadService) {
        score += 20;
        reasons.push("Wide service area");
      }
      if (operator.roamingCapabilityKm >= maxRoaming) {
        score += 15;
        reasons.push(`Supports ${maxRoaming} km roaming`);
      }
      if (vehicleMatch) {
        score += 15;
        reasons.push(`Suitable ${tripResult.trip.vehicleType}`);
      }
      if (capacityMatch) {
        score += 10;
        reasons.push(`Fits ${tripResult.trip.passengerCount} passengers`);
      }
      if (tripTypeMatch) {
        score += 10;
        reasons.push("Experienced with this trip type");
      }
      if (operator.maxTripDistanceKm >= route.totalDistanceKm) {
        score += 5;
        reasons.push("Covers the full route");
      }
      if (operator.verificationStatus === "verified") {
        score += 5;
        reasons.push("Verified operator");
      }
      score = Math.min(99, score);
      const label = score >= 80 ? "Excellent match" : score >= 60 ? "Strong match" : "Good option";
      return { operator: formatted, score, label, reasons };
    })
    .sort((a, b) => b.score - a.score);
  res.json(MatchOperatorsResponse.parse(matches));
});

router.post("/enquiries", async (req, res): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const operatorId = Number(parsed.data.operatorId);
  const fallbackTrip = parsed.data.tripId === "general"
    ? (await db.select({ id: tripsTable.id }).from(tripsTable).orderBy(desc(tripsTable.createdAt)).limit(1))[0]
    : undefined;
  const tripId = parsed.data.tripId === "general" ? fallbackTrip?.id ?? 0 : Number(parsed.data.tripId);
  const [operator] = await db.select({ id: operatorsTable.id }).from(operatorsTable).where(eq(operatorsTable.id, operatorId));
  const [trip] = await db.select({ id: tripsTable.id }).from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!operator || !trip) {
    res.status(404).json({ error: "Operator or trip not found" });
    return;
  }
  const [enquiry] = await db
    .insert(enquiriesTable)
    .values({ operatorId, tripId, message: parsed.data.message })
    .returning();
  if (!enquiry) {
    res.status(500).json({ error: "Unable to create enquiry" });
    return;
  }
  res.status(201).json(
    CreateEnquiryResponse.parse({
      id: String(enquiry.id),
      operatorId: String(enquiry.operatorId),
      tripId: String(enquiry.tripId),
      message: enquiry.message,
      status: enquiry.status,
      createdAt: enquiry.createdAt.toISOString(),
    }),
  );
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [{ value: activeTripCount }] = await db.select({ value: count() }).from(tripsTable);
  const [{ value: enquiryCount }] = await db.select({ value: count() }).from(enquiriesTable);
  const nextTrip = await db.select({ startDate: tripsTable.startDate }).from(tripsTable).orderBy(asc(tripsTable.startDate)).limit(1);
  res.json(
    GetDashboardSummaryResponse.parse({
      activeTripCount,
      enquiryCount,
      savedOperatorCount: 0,
      nextTrip: nextTrip[0]?.startDate ?? null,
    }),
  );
});

export default router;