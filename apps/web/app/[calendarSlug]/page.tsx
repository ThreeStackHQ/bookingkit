interface BookingPageProps {
  params: { calendarSlug: string };
}

export default function BookingPage({ params }: BookingPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Book a time</h1>
      <p className="mt-2 text-muted-foreground">
        Calendar: {params.calendarSlug}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Public booking page — stub
      </p>
    </main>
  );
}
