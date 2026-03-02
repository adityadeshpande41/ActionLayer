import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/use-project";
import { calendar as calendarApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users, FileText, Trash2, Edit } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";

export default function CalendarPage() {
  const { toast } = useToast();
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Google Calendar status
  const { data: googleStatus } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: () => fetch("/api/calendar/google/status").then(r => r.json()),
  });

  const handleConnectGoogle = () => {
    if (googleStatus?.authUrl) {
      window.location.href = googleStatus.authUrl;
    }
  };

  // Import from Google Calendar mutation
  const importGoogleMutation = useMutation({
    mutationFn: (clearExisting: boolean = false) => {
      if (!selectedProjectId) throw new Error("No project selected");
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return fetch(`/api/calendar/google/import/${selectedProjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          clearExisting,
        }),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast({ 
        title: "Import Complete", 
        description: `Imported ${data.imported} of ${data.total} events from Google Calendar.` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "meeting",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    location: "",
    attendees: "",
    reminderMinutes: 15,
  });

  // Fetch events for the selected month
  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events", selectedProjectId, selectedDate],
    queryFn: () => {
      if (!selectedProjectId) return [];
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return calendarApi.getByDateRange(
        selectedProjectId,
        start.toISOString(),
        end.toISOString()
      );
    },
    enabled: !!selectedProjectId,
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["upcoming-events", selectedProjectId],
    queryFn: () => selectedProjectId ? calendarApi.getUpcoming(selectedProjectId, 5) : [],
    enabled: !!selectedProjectId,
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => calendarApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast({ title: "Event Created", description: "Calendar event has been created successfully." });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => calendarApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast({ title: "Event Updated", description: "Calendar event has been updated successfully." });
      setEditingEvent(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      toast({ title: "Event Deleted", description: "Calendar event has been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventType: "meeting",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      location: "",
      attendees: "",
      reminderMinutes: 15,
    });
  };

  const handleSubmit = () => {
    if (!selectedProjectId || !formData.title || !formData.startDate) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    const startDateTime = formData.allDay 
      ? new Date(formData.startDate).toISOString()
      : new Date(`${formData.startDate}T${formData.startTime}`).toISOString();

    const endDateTime = formData.endDate
      ? formData.allDay
        ? new Date(formData.endDate).toISOString()
        : new Date(`${formData.endDate}T${formData.endTime || formData.startTime}`).toISOString()
      : undefined;

    const eventData = {
      projectId: selectedProjectId,
      title: formData.title,
      description: formData.description || undefined,
      eventType: formData.eventType,
      startDate: startDateTime,
      endDate: endDateTime,
      allDay: formData.allDay,
      location: formData.location || undefined,
      attendees: formData.attendees ? formData.attendees.split(",").map(a => a.trim()) : undefined,
      reminderMinutes: formData.reminderMinutes,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    setFormData({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType,
      startDate: format(startDate, "yyyy-MM-dd"),
      startTime: event.allDay ? "" : format(startDate, "HH:mm"),
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
      endTime: endDate && !event.allDay ? format(endDate, "HH:mm") : "",
      allDay: event.allDay,
      location: event.location || "",
      attendees: event.attendees ? event.attendees.join(", ") : "",
      reminderMinutes: event.reminderMinutes || 15,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  // Get events for selected date
  const selectedDateEvents = events.filter((event: any) =>
    isSameDay(parseISO(event.startDate), selectedDate)
  );

  // Get event type badge color
  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      meeting: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      deadline: "bg-red-500/10 text-red-600 border-red-500/20",
      milestone: "bg-green-500/10 text-green-600 border-green-500/20",
      reminder: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      "action-item": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  // Get dates with events for calendar highlighting
  const datesWithEvents = events.map((event: any) => parseISO(event.startDate));

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Calendar" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Project Calendar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage meetings, deadlines, and milestones
            </p>
          </div>
          <div className="flex gap-2">
            {googleStatus?.configured ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importGoogleMutation.mutate(true)}
                  disabled={importGoogleMutation.isPending || !selectedProjectId}
                >
                  {importGoogleMutation.isPending ? "Importing..." : "Sync Google Calendar"}
                </Button>
                <Badge variant="secondary" className="px-3 py-1">
                  ✓ Connected
                </Badge>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGoogle}
                disabled={!googleStatus?.authUrl}
              >
                Connect Google Calendar
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Team standup, Client meeting, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="action-item">Action Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details about this event..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={formData.allDay}
                    onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="allDay" className="cursor-pointer">All day event</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  {!formData.allDay && (
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  {!formData.allDay && (
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Conference room, Zoom link, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Attendees</Label>
                  <Input
                    id="attendees"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    placeholder="Comma-separated names or emails"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder">Reminder</Label>
                  <Select 
                    value={formData.reminderMinutes.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, reminderMinutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No reminder</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingEvent(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingEvent ? "Update Event" : "Create Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasEvent: datesWithEvents,
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/10 font-bold",
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} className="p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <Badge variant="outline" className={`text-[10px] mt-1 ${getEventTypeBadge(event.eventType)}`}>
                          {event.eventType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(event.startDate), "MMM d, h:mm a")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Events on {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No events on this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event: any) => (
                  <div key={event.id} className="p-4 rounded-md border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge variant="outline" className={`text-[10px] ${getEventTypeBadge(event.eventType)}`}>
                            {event.eventType}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.allDay 
                              ? "All day" 
                              : `${format(parseISO(event.startDate), "h:mm a")}${event.endDate ? ` - ${format(parseISO(event.endDate), "h:mm a")}` : ""}`
                            }
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} attendees
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
