import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { searchRides } from "../../services/rides";
import { useAuth } from "../../context/AuthContext";

/**
 * Helper: format "HH:mm" or "HH:mm:ss" to "h:mm AM/PM"
 */
const formatTime = (time?: string) => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return time;

  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
};

/**
 * Helper: parse time string "HH:mm" -> Date (today with that time)
 */
const parseDepartureToDate = (time?: string) => {
  if (!time) return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

/* ---------- New shared normalizer (add near helpers) ---------- */
const normalizeInput = (text: string) => text.trim().replace(/\s+/g, " ");
/* -------------------------------------------------------------- */

type SortType =
  | "PRICE_LOW"
  | "PRICE_HIGH"
  | "DEPARTURE_EARLY"
  | "FASTEST"
  | "SEATS";

export default function FindRide() {
  const router = useRouter();
  const { token } = useAuth();
  const { from: fromParam, to: toParam } = useLocalSearchParams();

  const [from, setFrom] = useState((fromParam as string) || "");
  const [to, setTo] = useState((toParam as string) || "");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // NEW: suggestion states + geocode loading
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  // NEW: focus states to control showing suggestions
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Sorting + filter modal state
  const [sortBy, setSortBy] = useState<SortType>("PRICE_LOW");
  const [showFilter, setShowFilter] = useState(false);

  // MOVE Pick logic (frontend-only scoring)
  const getMovePick = (rides: any[]) => {
    if (!rides || rides.length === 0) return null;

    const scored = rides.map((r) => {
      const pricePerSeat = r.pricePerSeat || 1;
      const depNum = parseInt(
        String(r.departureTime || "2359").replace(":", ""),
        10
      );
      const priceScore = 1000 / pricePerSeat; // cheaper => higher
      const timeScore = 1000 / (isNaN(depNum) || depNum === 0 ? 2359 : depNum); // earlier => higher
      const seatScore = (r.availableSeats || 0) * 10;

      return {
        ...r,
        _score: priceScore + timeScore + seatScore,
      };
    });

    return scored.sort((a, b) => b._score - a._score)[0];
  };

  /* ---------- Suggestion fetcher (Nominatim) ---------- */
  const fetchSuggestions = async (query: string, type: "FROM" | "TO") => {
    const clean = normalizeInput(query);
    if (clean.length < 3) {
      if (type === "FROM") setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }

    try {
      setGeoLoading(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          clean
        )}&format=json&limit=5`,
        {
          headers: {
            "User-Agent": "MOVE-App/1.0",
          },
        }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        if (type === "FROM") setFromSuggestions(data);
        else setToSuggestions(data);
      }
    } catch (e) {
      console.log("Nominatim error", e);
    } finally {
      setGeoLoading(false);
    }
  };
  /* ---------------------------------------------------- */

  /* ---------- FIXED onSearch: normalize inputs, prevent empty calls, guard loading ---------- */
  const onSearch = async () => {
    const fromClean = normalizeInput(from);
    const toClean = normalizeInput(to);

    // prevent double taps / concurrent searches
    if (loading) return;

    if (!fromClean || !toClean) {
      Alert.alert("Missing info", "Please enter both From and To locations");
      return;
    }

    if (!token) {
      // defensive: ensure auth token present
      Alert.alert("Authentication required", "Please sign in to search rides.");
      return;
    }

    try {
      // dismiss keyboard for cleaner UX
      Keyboard.dismiss();

      // CLOSE suggestions to avoid overlap with results
      setFromSuggestions([]);
      setToSuggestions([]);
      setFromFocused(false);
      setToFocused(false);

      setLoading(true);
      setHasSearched(true);
      setResults([]);

      // sync UI with normalized values
      setFrom(fromClean);
      setTo(toClean);

      // defensive: ensure API returns array or fallback to empty array
      const apiResponse = await searchRides({
        departure: fromClean,
        destination: toClean,
        date,
        token,
      });
      const data = Array.isArray(apiResponse) ? apiResponse : apiResponse || [];

      const bestRide = getMovePick(data);

      if (bestRide) {
        const marked = data.map((r: any) =>
          r.id === bestRide.id ? { ...r, _isMovePick: true } : { ...r, _isMovePick: false }
        );

        const ordered = [
          marked.find((m: any) => m._isMovePick),
          ...marked.filter((m: any) => !m._isMovePick),
        ];

        setResults(ordered as any[]);
      } else {
        setResults(data);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Search failed", "Something went wrong while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  /* --------------------------------------------------------------------------- */

  // Hide suggestions when keyboard is dismissed (tap outside / done)
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      setFromFocused(false);
      setToFocused(false);
      setFromSuggestions([]);
      setToSuggestions([]);
    });
    return () => sub.remove();
  }, []);

  // Sorting derived results but keep MOVE Pick on top
  const sortedResults = [...results].sort((a, b) => {
    if (a._isMovePick && !b._isMovePick) return -1;
    if (!a._isMovePick && b._isMovePick) return 1;

    switch (sortBy) {
      case "PRICE_LOW":
        return (a.pricePerSeat || 0) - (b.pricePerSeat || 0);

      case "PRICE_HIGH":
        return (b.pricePerSeat || 0) - (a.pricePerSeat || 0);

      case "DEPARTURE_EARLY":
        return String(a.departureTime || "").localeCompare(String(b.departureTime || ""));

      case "FASTEST":
        return (a.distanceKm || 0) - (b.distanceKm || 0);

      case "SEATS":
        return (b.availableSeats || 0) - (a.availableSeats || 0);

      default:
        return 0;
    }
  });

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>MOVE</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* SEARCH CARD */}
        <View style={styles.heroCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleBadge}>
              <Ionicons name="search" size={16} color="#1E40AF" />
            </View>
            <Text style={styles.cardTitle}>Find your next ride</Text>
          </View>

          {/* FROM */}
          <View>
            <View style={styles.inputRow}>
              <Ionicons name="radio-button-on" size={16} color="#22C55E" />
              <TextInput
                placeholder="From"
                placeholderTextColor="#9CA3AF"
                value={from}
                onFocus={() => setFromFocused(true)}
                onBlur={() => {
                  setFromFocused(false);
                  setFrom(normalizeInput(from));
                  setFromSuggestions([]);
                }}
                onChangeText={(text) => {
                  setFrom(text);
                  setFromFocused(true);

                  // avoid calling fetcher for tiny queries
                  if (normalizeInput(text).length < 3) {
                    setFromSuggestions([]);
                    return;
                  }

                  fetchSuggestions(text, "FROM");
                }}
                style={styles.input}
              />
            </View>

            {/* FROM suggestions (only when input focused) */}
            {fromFocused && fromSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {fromSuggestions.map((item) => (
                  <Pressable
                    key={item.place_id}
                    onPress={() => {
                      setFrom(normalizeInput(item.display_name));
                      setFromSuggestions([]);
                      setFromFocused(false);
                      Keyboard.dismiss();
                    }}
                    style={styles.suggestionItem}
                  >
                    <Text numberOfLines={2}>{item.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* TO */}
          <View>
            <View style={styles.inputRow}>
              <Ionicons name="location" size={18} color="#EF4444" />
              <TextInput
                placeholderTextColor="#9CA3AF"
                placeholder="To"
                value={to}
                onFocus={() => setToFocused(true)}
                onBlur={() => {
                  setToFocused(false);
                  setTo(normalizeInput(to));
                  setToSuggestions([]);
                }}
                onChangeText={(text) => {
                  setTo(text);
                  setToFocused(true);

                  if (normalizeInput(text).length < 3) {
                    setToSuggestions([]);
                    return;
                  }

                  fetchSuggestions(text, "TO");
                }}
                style={styles.input}
              />
            </View>

            {/* TO suggestions (only when input focused) */}
            {toFocused && toSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {toSuggestions.map((item) => (
                  <Pressable
                    key={item.place_id}
                    onPress={() => {
                      setTo(normalizeInput(item.display_name));
                      setToSuggestions([]);
                      setToFocused(false);
                      Keyboard.dismiss();
                    }}
                    style={styles.suggestionItem}
                  >
                    <Text numberOfLines={2}>{item.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* DATE */}
          <Pressable
            style={styles.dateRow}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#1E40AF" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>

            <View style={styles.quickDates}>
              <Pressable onPress={() => setDate(today)}>
                <Text style={styles.quick}>Today</Text>
              </Pressable>
              <Pressable onPress={() => setDate(tomorrow)}>
                <Text style={styles.quick}>Tomorrow</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* SEARCH BUTTON */}
          <Pressable
            disabled={loading || !from.trim() || !to.trim()}
            style={[
              styles.searchBtn,
              (!from.trim() || !to.trim() || loading) && { opacity: 0.6 },
            ]}
            onPress={onSearch}
          >
            <Text style={styles.searchText}>
              {loading ? "Searching…" : "Search rides"}
            </Text>
          </Pressable>
        </View>

        {/* FILTER BUTTON */}
        {results.length > 0 && (
          <Pressable
            style={styles.filterBtn}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={18} color="#1E40AF" />
            <Text style={styles.filterText}>Filter & Sort</Text>
          </Pressable>
        )}

        {/* POPULAR ROUTES (ONLY BEFORE SEARCH) */}
        {!hasSearched && !loading && (
          <View style={styles.popular}>
            <Text style={styles.sectionTitle}>Popular routes</Text>

            {[
              ["Hyderabad", "Vijayawada"],
              ["Bangalore", "Chennai"],
              ["Hyderabad", "Bangalore"],
            ].map((r, i) => (
              <Pressable
                key={i}
                style={styles.route}
                onPress={() => {
                  // auto-trim popular route values
                  setFrom(normalizeInput(r[0]));
                  setTo(normalizeInput(r[1]));
                }}
              >
                <Ionicons name="trending-up" size={16} color="#1E40AF" />
                <Text style={styles.routeText}>
                  {r[0]} → {r[1]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* LOADING */}
        {(loading || geoLoading) && <ActivityIndicator style={{ marginTop: 30 }} />}

        {/* EMPTY STATE */}
        {hasSearched && !loading && results.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptyText}>
              Sorry, we couldn’t find any rides for this route.
              Try changing the date or destination.
            </Text>
          </View>
        )}

        {/* RIDE CARDS */}
        {sortedResults.map((r: any, index: number) => {
          const durationHrs = Math.max(1, Math.round((r.distanceKm || 0) / 50));

          // Optional: "Leaving soon" if departure within next 2 hours
          const depDate = parseDepartureToDate(r.departureTime);
          const now = new Date();
          const diffMinutes = depDate ? (depDate.getTime() - now.getTime()) / 60000 : Infinity;
          const isLeavingSoon = diffMinutes >= 0 && diffMinutes <= 120;

          return (
            <View key={r.id} style={styles.rideCard}>
              {/* MOVE Pick badge */}
              {index === 0 && r._isMovePick && (
                <View style={styles.movePickBadge}>
                  <Ionicons name="flash" size={14} color="#fff" />
                  <Text style={styles.movePickText}>MOVE Pick</Text>
                </View>
              )}

              {/* TOP ROW */}
              <View style={styles.rideTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {r.driverName?.[0]?.toUpperCase() || "D"}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{r.driverName || "Driver"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text style={styles.subText}>
                      {r.availableSeats} seats available
                    </Text>
                    {isLeavingSoon && (
                      <View style={styles.leavingSoonBadge}>
                        <Text style={styles.leavingSoonText}>🚀 Leaving soon</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.price}>₹{r.pricePerSeat}</Text>
              </View>

              {/* ROUTE - safe & truncated */}
              <View style={styles.routeRow}>
                <Text
                  style={styles.city}
                  numberOfLines={1}
                >
                  {normalizeInput(String(r.departureLocation || r.departure || from)).split(",")[0]}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#6B7280" style={{ marginHorizontal: 6 }} />
                <Text
                  style={styles.city}
                  numberOfLines={1}
                >
                  {normalizeInput(String(r.destinationLocation || r.destination || to)).split(",")[0]}
                </Text>
              </View>

              {/* META - formatted time (AM/PM) */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#374151" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{formatTime(r.departureTime)}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="speedometer-outline" size={14} color="#374151" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{durationHrs} hrs</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="car-outline" size={14} color="#374151" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{Math.round(r.distanceKm || 0)} km</Text>
                </View>
              </View>

              {/* CTA - navigate to ride details route */}
              <Pressable
                style={styles.viewBtn}
                onPress={() => router.push(`/rides/${r.id}`)}
              >
                <Text style={styles.viewText}>Book Ride</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* DATE PICKER */}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={(_, selected) => {
            setShowPicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.filterOverlay}>
          <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>Sort rides by</Text>

            {[
              ["PRICE_LOW", "Price: Low → High"],
              ["PRICE_HIGH", "Price: High → Low"],
              ["DEPARTURE_EARLY", "Departure: Early"],
              ["FASTEST", "Fastest ride"],
              ["SEATS", "More seats"],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                style={[
                  styles.filterOption,
                  sortBy === key && styles.filterActive,
                ]}
                onPress={() => {
                  setSortBy(key as SortType);
                  setShowFilter(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    sortBy === key && { color: "#1E40AF" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    padding: 16,
    backgroundColor: "#fff",
  },

  logo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E40AF",
  },

  heroCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    elevation: 6,
    position: "relative", // ensure suggestions absolute inside this container behave correctly
    zIndex: 10,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  titleBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E40AF",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },

  input: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: "#111827"
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  dateText: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#1E40AF",
  },

  quickDates: {
    flexDirection: "row",
    marginLeft: "auto",
  },

  quick: {
    marginLeft: 12,
    color: "#1E40AF",
    fontWeight: "700",
  },

  searchBtn: {
    marginTop: 18,
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  searchText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  popular: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  sectionTitle: {
    fontWeight: "800",
    marginBottom: 10,
  },

  route: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  routeText: {
    marginLeft: 10,
    fontWeight: "600",
  },

  resultCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
  },

  driver: {
    fontWeight: "800",
    fontSize: 16,
  },

  meta: {
    marginTop: 4,
    color: "#6B7280",
  },

  bookBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  bookText: {
    color: "#1E40AF",
    fontWeight: "700",
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // suggestions - positioned to avoid overlapping search button on small screens
  suggestionsBox: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 200,
    elevation: 10, // ensure it appears above other cards on Android
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  // Filter button
  filterBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },

  filterText: {
    marginLeft: 6,
    color: "#1E40AF",
    fontWeight: "700",
  },

  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },

  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  filterTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  filterOption: {
    paddingVertical: 14,
  },

  filterActive: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  filterOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },

  /* PREMIUM RIDE CARD STYLES */
  rideCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
    position: "relative",
  },

  rideTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E40AF",
  },

  driverName: {
    fontSize: 16,
    fontWeight: "800",
  },

  subText: {
    color: "#6B7280",
  },

  price: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16A34A",
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  city: {
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },

  /* UPDATED META ROW to emphasise fast + cheap */
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 14,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },

  viewBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  viewText: {
    color: "#1E40AF",
    fontWeight: "800",
  },

  /* MOVE Pick badge */
  movePickBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  movePickText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
  },

  /* Leaving soon badge */
  leavingSoonBadge: {
    marginLeft: 10,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  leavingSoonText: {
    color: "#B45309",
    fontWeight: "700",
    fontSize: 12,
  },

  /* MODAL / BOTTOM SHEET STYLES used by RideDetailsModal too */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },

  closeBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 10,
  },

  modalDriver: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 20,
  },

  modalRoute: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  modalMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  modalMeta: {
    color: "#6B7280",
    fontWeight: "600",
  },

  modalPrice: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "900",
    color: "#16A34A",
  },

  bookRideBtn: {
    marginTop: 22,
    backgroundColor: "#1E40AF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  bookRideText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});