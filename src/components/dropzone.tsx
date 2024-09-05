"use client";

import { useState, useEffect, useRef } from "react";
import ReactDropzone from "react-dropzone";
import { FiUploadCloud } from "react-icons/fi";
import { LuFileSymlink } from "react-icons/lu";
import { MdClose, MdDone } from "react-icons/md";
import { ImSpinner3 } from "react-icons/im";
import { HiOutlineDownload } from "react-icons/hi";
import { BiError } from "react-icons/bi";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import bytesToSize from "@/lib/utils/bytes-to-size";
import fileToIcon from "@/lib/utils/file-to-icon";
import compressFileName from "@/lib/utils/compress-file-name";
import convertFile from "@/lib/utils/convert";
import loadFfmpeg from "@/lib/utils/load-ffmpeg";
import type { Action } from "@/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const EXTENSIONS = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "ico",
    "tif",
    "tiff",
    "svg",
    "raw",
    "tga",
  ],
  video: [
    "mp4",
    "m4v",
    "mp4v",
    "3gp",
    "3g2",
    "avi",
    "mov",
    "wmv",
    "mkv",
    "flv",
    "ogv",
    "webm",
    "h264",
    "264",
    "hevc",
    "265",
  ],
  audio: ["mp3", "wav", "ogg", "aac", "wma", "flac", "m4a"],
};

const ACCEPTED_FILES = {
  "image/*": EXTENSIONS.image.map((ext) => `.${ext}`),
  "audio/*": EXTENSIONS.audio.map((ext) => `.${ext}`),
  "video/*": EXTENSIONS.video.map((ext) => `.${ext}`),
};

export default function Dropzone() {
  const { toast } = useToast();
  const [isHover, setIsHover] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [defaultValues, setDefaultValues] = useState("video");
  const [selected, setSelected] = useState("...");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    const load = async () => {
      ffmpegRef.current = await loadFfmpeg();
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    const ready = actions.every((action) => action.to);
    setIsReady(ready);
  }, [actions]);

  const reset = () => {
    setIsDone(false);
    setActions([]);
    setIsReady(false);
    setIsConverting(false);
  };

  const download = (action: Action) => {
    const a = document.createElement("a");
    a.href = action.url;
    a.download = action.output;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(action.url);
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    actions.forEach((action) => !action.is_error && download(action));
  };

  const convert = async () => {
    if (!ffmpegRef.current) {
      toast({
        title: "Error",
        description: "FFmpeg is not loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    const updatedActions = await Promise.all(
      actions.map(async (action) => {
        if (action.is_converted || action.is_error) return action;

        try {
          const { url, output } = await convertFile(
            ffmpegRef.current as FFmpeg,
            action
          );
          return { ...action, is_converted: true, url, output };
        } catch {
          return { ...action, is_error: true };
        }
      })
    );

    setActions(updatedActions);
    setIsDone(true);
    setIsConverting(false);
  };

  const handleUpload = (data: File[]) => {
    setIsHover(false);
    setActions(
      data.map((file) => ({
        file_name: file.name,
        file_size: file.size,
        from: file.name.split(".").pop() || "",
        to: null,
        file_type: file.type,
        file,
        is_converted: false,
        is_converting: false,
        is_error: false,
      }))
    );
  };

  const updateAction = (fileName: string, to: string) => {
    setActions(
      actions.map((action) =>
        action.file_name === fileName ? { ...action, to } : action
      )
    );
  };

  const deleteAction = (action: Action) => {
    setActions(actions.filter((a) => a !== action));
  };

  return actions.length ? (
    <div className="space-y-6">
      {actions.map((action, i) => (
        <div
          key={i}
          className="relative flex items-center justify-between p-4 border rounded-xl lg:flex-nowrap flex-wrap gap-4"
        >
          {!isLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}

          <div className="flex items-center gap-4">
            <span className="text-2xl">{fileToIcon(action.file_type)}</span>
            <div className="flex items-center gap-1 w-96">
              <span className="text-md font-medium truncate">
                {compressFileName(action.file_name)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({bytesToSize(action.file_size)})
              </span>
            </div>
          </div>

          {action.is_error ? (
            <Badge variant="destructive" className="flex items-center gap-2">
              <span>Error Converting File</span>
              <BiError />
            </Badge>
          ) : action.is_converted ? (
            <Badge
              variant="default"
              className="flex items-center gap-2 bg-green-500"
            >
              <span>Done</span>
              <MdDone />
            </Badge>
          ) : action.is_converting ? (
            <Badge variant="default" className="flex items-center gap-2">
              <span>Converting</span>
              <ImSpinner3 className="animate-spin" />
            </Badge>
          ) : (
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Convert to</span>
              <Select
                value={selected}
                onValueChange={(value) => {
                  if (EXTENSIONS.audio.includes(value))
                    setDefaultValues("audio");
                  if (EXTENSIONS.video.includes(value))
                    setDefaultValues("video");
                  setSelected(value);
                  updateAction(action.file_name, value);
                }}
              >
                <SelectTrigger className="w-32 text-center text-md font-medium bg-background text-muted-foreground">
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  {action.file_type.startsWith("image") && (
                    <div className="grid grid-cols-2 gap-2">
                      {EXTENSIONS.image.map((ext) => (
                        <SelectItem
                          key={ext}
                          value={ext}
                          className="text-center"
                        >
                          {ext}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                  {action.file_type.startsWith("video") && (
                    <Tabs defaultValue={defaultValues}>
                      <TabsList>
                        <TabsTrigger value="video">Video</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                      </TabsList>
                      <TabsContent value="video">
                        <div className="grid grid-cols-3 gap-2">
                          {EXTENSIONS.video.map((ext) => (
                            <SelectItem
                              key={ext}
                              value={ext}
                              className="text-center"
                            >
                              {ext}
                            </SelectItem>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="audio">
                        <div className="grid grid-cols-3 gap-2">
                          {EXTENSIONS.audio.map((ext) => (
                            <SelectItem
                              key={ext}
                              value={ext}
                              className="text-center"
                            >
                              {ext}
                            </SelectItem>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                  {action.file_type.startsWith("audio") && (
                    <div className="grid grid-cols-2 gap-2">
                      {EXTENSIONS.audio.map((ext) => (
                        <SelectItem
                          key={ext}
                          value={ext}
                          className="text-center"
                        >
                          {ext}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {action.is_converted ? (
            <Button variant="outline" onClick={() => download(action)}>
              Download
            </Button>
          ) : (
            <MdClose
              className="cursor-pointer text-2xl"
              onClick={() => deleteAction(action)}
            />
          )}
        </div>
      ))}

      <div className="flex justify-end">
        {isDone ? (
          <div className="space-y-4">
            <Button
              size="lg"
              onClick={downloadAll}
              className="flex items-center gap-2"
            >
              <HiOutlineDownload />
              Download All
            </Button>
            <Button
              variant="ghost"
              onClick={reset}
              className="text-destructive"
            >
              Reset
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={convert}
            disabled={!isReady || isConverting}
            className="flex items-center gap-2"
          >
            <FiUploadCloud />
            Convert
          </Button>
        )}
      </div>
    </div>
  ) : (
    <ReactDropzone onDrop={handleUpload} accept={ACCEPTED_FILES}>
      {({ getRootProps, getInputProps }) => (
        <div
          {...getRootProps()}
          className={`dropzone ${
            isHover ? "hover" : ""
          } w-full h-60 border-dashed border-2 rounded-lg flex flex-col justify-center items-center cursor-pointer`}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <input {...getInputProps()} />
          <p className="text-lg">
            Drag & drop files here, or click to select files
          </p>
        </div>
      )}
    </ReactDropzone>
  );
}
