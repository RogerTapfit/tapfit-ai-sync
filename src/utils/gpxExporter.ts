import { RunSession } from '@/types/run';

/**
 * Generate GPX file content from run session
 */
export function generateGPX(session: RunSession): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" 
     creator="TapFit" 
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>TapFit Run - ${new Date(session.started_at).toLocaleDateString()}</name>
    <time>${new Date(session.started_at).toISOString()}</time>
  </metadata>
  <trk>
    <name>Run ${new Date(session.started_at).toLocaleString()}</name>
    <type>running</type>
    <trkseg>
${session.points.map(p => `      <trkpt lat="${p.lat}" lon="${p.lon}">
        ${p.altitude !== undefined ? `<ele>${p.altitude.toFixed(1)}</ele>` : ''}
        <time>${new Date(p.timestamp).toISOString()}</time>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;
  
  return xml;
}

/**
 * Download GPX file
 */
export function downloadGPX(session: RunSession): void {
  const gpxContent = generateGPX(session);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `tapfit-run-${new Date(session.started_at).toISOString().split('T')[0]}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
