/**
 * HLS Generator for creating HTTP Live Streaming manifests and segments
 */

import { VideoSegment } from './VideoEncoder';

export interface HLSManifest {
  masterPlaylist: string;
  mediaPlaylist: string;
  segments: string[];
}

export interface HLSOptions {
  targetDuration: number;
  segmentLength: number;
  baseUrl: string;
}

export class HLSGenerator {
  private options: HLSOptions;
  
  constructor(options: HLSOptions) {
    this.options = options;
  }

  generateMasterPlaylist(variants: Array<{
    bandwidth: number;
    width: number;
    height: number;
    playlistUrl: string;
  }>): string {
    let playlist = '#EXTM3U\n#EXT-X-VERSION:6\n\n';
    
    variants.forEach(variant => {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}\n`;
      playlist += `${variant.playlistUrl}\n\n`;
    });
    
    return playlist;
  }

  generateMediaPlaylist(segments: VideoSegment[]): string {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:6\n';
    playlist += `#EXT-X-TARGETDURATION:${this.options.targetDuration}\n`;
    playlist += '#EXT-X-PLAYLIST-TYPE:VOD\n\n';
    
    segments.forEach((segment, index) => {
      playlist += `#EXTINF:${segment.duration.toFixed(3)},\n`;
      playlist += `${this.options.baseUrl}/segment_${index}.ts\n`;
    });
    
    playlist += '#EXT-X-ENDLIST\n';
    
    return playlist;
  }

  async stitchSegments(segments: VideoSegment[]): Promise<HLSManifest> {
    console.log(`Stitching ${segments.length} segments for HLS`);
    
    // Generate playlists
    const mediaPlaylist = this.generateMediaPlaylist(segments);
    
    const masterPlaylist = this.generateMasterPlaylist([
      {
        bandwidth: 1500000,
        width: 1920,
        height: 1080,
        playlistUrl: 'media.m3u8'
      }
    ]);
    
    const segmentUrls = segments.map((_, index) => 
      `${this.options.baseUrl}/segment_${index}.ts`
    );
    
    return {
      masterPlaylist,
      mediaPlaylist,
      segments: segmentUrls
    };
  }

  async updateManifestForDelta(
    existingManifest: string,
    updatedSegments: Map<number, VideoSegment>
  ): string {
    console.log(`Updating HLS manifest with ${updatedSegments.size} changed segments`);
    
    // Parse existing manifest and update only changed segments
    const lines = existingManifest.split('\n');
    let updatedManifest = '';
    let segmentIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        // This is a segment duration line
        if (updatedSegments.has(segmentIndex)) {
          // Update duration for changed segment
          const newSegment = updatedSegments.get(segmentIndex)!;
          updatedManifest += `#EXTINF:${newSegment.duration.toFixed(3)},\n`;
        } else {
          updatedManifest += line + '\n';
        }
        
        // Next line should be the segment URL
        i++;
        if (i < lines.length) {
          if (updatedSegments.has(segmentIndex)) {
            // Update segment URL with new timestamp/version
            const timestamp = Date.now();
            updatedManifest += `${this.options.baseUrl}/segment_${segmentIndex}_${timestamp}.ts\n`;
          } else {
            updatedManifest += lines[i] + '\n';
          }
        }
        
        segmentIndex++;
      } else {
        updatedManifest += line + '\n';
      }
    }
    
    return updatedManifest;
  }

  static getRecommendedOptions(quality: 'preview' | 'high'): HLSOptions {
    return {
      targetDuration: quality === 'high' ? 10 : 6,
      segmentLength: quality === 'high' ? 6 : 4,
      baseUrl: '/hls'
    };
  }
}
