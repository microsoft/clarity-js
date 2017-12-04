export default function(event: IEvent): IEventArray {
  let data: IEventArray = [
    event.type,
    event.id,
    event.time,
    event.converter(event.data)
  ];
  return data;
}
