import { useCamera } from '@ionic/react-hooks/camera';
import { CameraPhoto, CameraResultType, CameraSource, FilesystemDirectory } from '@capacitor/core';
import { base64FromPath, useFilesystem } from '@ionic/react-hooks/filesystem';
import { Photo } from './PhotoProps';
import { getLogger } from '../core';

const log = getLogger('PhotoGallery');

export function usePhotoGallery() {
    const { getPhoto } = useCamera();

    const takePhoto = async () => {
        log('Taking photo');
        const cameraPhoto = await getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });
        const fileName = new Date().getTime() + '.png';
        return await savePicture(cameraPhoto, fileName);
    };

    const { deleteFile, writeFile, readFile } = useFilesystem();
    const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
        log('Saving photo');
        const base64Data = await base64FromPath(photo.webPath!);
        await writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });

        return {
            filepath: fileName,
            webPath: base64Data,
        };
    };

    const deletePhoto = async (photo: Photo) => {
        log('Deleting photo');
        const filename = photo.filepath?.substr(photo.filepath.lastIndexOf('/') + 1);
        await deleteFile({
            path: filename!,
            directory: FilesystemDirectory.Data
        });
    };

    const getOrCreate = async (photo: Photo) => {
        const filename = photo.filepath?.substr(photo.filepath.lastIndexOf('/') + 1);
        return readFile({
            path: filename!,
            directory: FilesystemDirectory.Data
        }).then(rez => {
            log('Read existing photo file');
            photo.webPath = `data:image/png;base64,${rez.data}`;
            return photo;
        }).catch(_ => (async () => {
            log('Created new photo file');
            const base64data = await base64FromPath(photo.webPath!);
            await writeFile({
                path: filename!,
                data: base64data,
                directory: FilesystemDirectory.Data
            });

            return {
                filepath: filename!,
                webPath: base64data
            };
        })());
    }

    return {
        takePhoto,
        deletePhoto,
        getOrCreate
    };
}
