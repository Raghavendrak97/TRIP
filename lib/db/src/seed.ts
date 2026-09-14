import { count } from "drizzle-orm";
import { db } from "./index";
import { operatorVehiclesTable, operatorsTable } from "./schema";

export async function seedTripQuoteDemoData(): Promise<void> {
  const [{ value }] = await db.select({ value: count() }).from(operatorsTable);
  if (value > 0) return;

  const operators = await db
    .insert(operatorsTable)
    .values([
      {
        businessName: "Coastal Compass Travels",
        operatorType: "Travel agency",
        description: "Thoughtful road trips across the Konkan coast, with local drivers who know the quiet beaches, food stops, and scenic detours.",
        city: "Panaji",
        state: "Goa",
        yearsExperience: 11,
        verificationStatus: "verified",
        rating: 49,
        totalReviews: 128,
        maxTripDistanceKm: 2500,
        maxTripDurationDays: 21,
        roamingCapabilityKm: 200,
        serviceAreas: ["Goa", "Karnataka", "Maharashtra"],
        preferredDestinations: ["Goa", "Gokarna", "Konkan"],
        tripTypes: ["family trip", "sightseeing", "long-distance road trip"],
        phone: "+919876543210",
        whatsapp: "+919876543210",
      },
      {
        businessName: "Namma Roadways",
        operatorType: "Driver collective",
        description: "Reliable Karnataka-based drivers for family getaways, airport transfers, and flexible weekend escapes.",
        city: "Bengaluru",
        state: "Karnataka",
        yearsExperience: 8,
        verificationStatus: "verified",
        rating: 47,
        totalReviews: 86,
        maxTripDistanceKm: 1400,
        maxTripDurationDays: 10,
        roamingCapabilityKm: 100,
        serviceAreas: ["Karnataka"],
        preferredDestinations: ["Coorg", "Gokarna", "Mysuru"],
        tripTypes: ["family trip", "airport transfer", "sightseeing"],
        phone: "+919812345678",
        whatsapp: "+919812345678",
      },
      {
        businessName: "Open Road Collective",
        operatorType: "Travel operator",
        description: "All-India road-trip specialists with a practical fleet for groups, long routes, and multi-state itineraries.",
        city: "Mumbai",
        state: "Maharashtra",
        yearsExperience: 15,
        verificationStatus: "verified",
        rating: 48,
        totalReviews: 214,
        maxTripDistanceKm: 5000,
        maxTripDurationDays: 30,
        roamingCapabilityKm: 300,
        serviceAreas: ["All India"],
        preferredDestinations: ["Goa", "Kerala", "Rajasthan", "Himachal Pradesh"],
        tripTypes: ["group tour", "adventure", "long-distance road trip", "corporate"],
        phone: "+919900112233",
        whatsapp: "+919900112233",
      },
    ])
    .returning({ id: operatorsTable.id });

  await db.insert(operatorVehiclesTable).values([
    { operatorId: operators[0].id, type: "tempo-traveller", label: "12-seat Tempo Traveller", seats: 12, ac: true },
    { operatorId: operators[0].id, type: "suv", label: "Toyota Innova Crysta", seats: 6, ac: true },
    { operatorId: operators[1].id, type: "suv", label: "Maruti Suzuki Ertiga", seats: 6, ac: true },
    { operatorId: operators[2].id, type: "tempo-traveller", label: "17-seat Urbania", seats: 17, ac: true },
    { operatorId: operators[2].id, type: "suv", label: "Toyota Fortuner", seats: 7, ac: true },
  ]);
}