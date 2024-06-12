import React, { useEffect, useState } from 'react';
import { Breadcrumb, Container, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

interface FileOrDirectory {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface FileBrowserProps {
  rootPath?: string;
}


const FileBrowser: React.FC<FileBrowserProps> = ({ rootPath = ''}) => {
  const location = useLocation();

  const restOfPath = location.pathname.replace(`/files`, '');
  const [files, setFiles] = useState<FileOrDirectory[]>([]);
  const [path, setPath] = useState<string>(rootPath || restOfPath);

  useEffect(() => {
    fetch('/api/files/' + (path || ''))
      .then((res) => res.json())
      .then((data) => setFiles(data));
  }, [path]);

  const handleClick = (file: FileOrDirectory) => {
    if (file.isDirectory) {
      fetch(`/api/files/${file.path}`)
        .then((res) => res.json())
        .then((data) => setFiles(data));
      path ? setPath(`${path}/${file.name}`) : setPath(file.name);
    } else {
      fetch(`/api/files/${file.path}`)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url);
        });
    }
  };

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => setPath('')}>Browse Reports</Breadcrumb.Item>
        {path && path.split('/').map((part, index) => (
          // if last part of path or length = 0, make it active
          (index === path.split('/').length - 1) ? 
          <Breadcrumb.Item key={index} active>{part}</Breadcrumb.Item> :
          // else make it clickable
          <Breadcrumb.Item key={index} onClick={() => setPath(path?.split('/').slice(0, index + 1).join('/'))}>
            {part}
          </Breadcrumb.Item>

        ))}
        </Breadcrumb>
      <Row>
    <ListGroup>
      {files.map((file) => (
        <ListGroupItem action key={file.path} onClick={() => handleClick(file)}>
          {file.isDirectory ? '📁' : '📄'} {file.name}
        </ListGroupItem>
      ))}
    </ListGroup>
    </Row>
    </Container>
  );
};

export default FileBrowser;