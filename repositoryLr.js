Repository Design Pattern là gì

Repository Design Pattern : từ giờ xin được viết tắt là RDP cho gọn, vì trong bài viết sẽ còn lặp lại cụm từ này nhiều. Tuy nhiên, xin lưu ý rằng, cách viết tắt này là không mấy thông dụng, nếu tự nhiên bạn dùng nó thì sẽ ko mấy ai hiểu bạn muốn nói gì đâu.

RDP có thể nói là một phong cách thiết kế code, mục đích của nó là nhằm đạt được nguyên tắc Inversion of Control (đã nói trong bài viết trước) bằng cách sử dụng Dependency Injection, qua đó thực hiện việc tách biệt giữa data access logic và business logic, cho phép người viết business logic có thể sử dụng data mà không cần phải quan tâm đến cấu trúc dữ liệu phía dưới.

RDP thực hiện điều này bằng cách thêm vào một tầng nằm giữa Business Logic và Data Source, gọi là các Repository. Các Repository này đóng vai trò như một kho chứa, nơi lưu trữ tất cả code liên quan đến việc truy cập dữ liệu, như việc mapping giữa thông tin hiển thị trên business logic với thông tin lưu trữ trong data source, hay các query truy vấn dữ liệu ...

Tóm tắt lại, về cấu trúc code theo RDP có thể tóm gọn như trong hình dưới đây repository_pattern.png

Tất nhiên, chỉ nói lí thuyết suông như thế thì khá là khó hiểu, chúng ta hãy cùng bắt tay vào làm thử một chút để nắm chắc hơn về khái niệm này.

P/S : Xin lưu ý nhỏ một điều, tuy rằng tiêu đề bài viết là "Tìm hiểu về RDP trong laravel", nhưng RDP, cũng như tất cả các Design Patter khác, hoàn toàn không phụ thuộc vào một framework, hay thậm chí là một ngôn ngữ nào hết. Bạn hoàn toàn có thể áp dụng RDP với CakePhp, Symphony hay Zend chứ không cứ phải là Laravel. Thậm chí nó còn chẳng cần là php, code C# bạn vẫn áp dụng được RDP như thường.

Một ví dụ đơn giản theo Repository Design Pattern

Hãy tưởng tượng, bài toán đặt ra cho chúng ta đang là, làm một site na ná kiểu Viblo chẳng hạn. Sẽ có user, sẽ có đăng bài viết, sẽ có thể comment bài viết ... Chúng ta sẽ dùng để bài đơn giản kiểu này để triển khai ví dụ mẫu về RPD.

Trước tiên, ta có thể hình dung ra trước, tất cả các model có thể xuất hiện trong ứng dụng của ta đều sẽ có thể có một vài các method chung, như lấy ra tất cả các bản ghi, lấy ra một số nhất định bản ghi mới nhất, lấy ra một số lượng bản ghi dựa vào limit và offset để thực hiện paginate ... Ngoài ra, trong bài viết trước, ta đã tìm hiểu một kĩ thuật đơn giản để thực hiện Dependency Injection là khai báo Interface chung, các class cụ thể sẽ là implements của interface này, sau đó, khi cần sử dụng ở đâu, ta mới inject từng class cụ thể vào. Từ 2 điều trên, ta có thể viết một cái RepositoryInterface, đại loại nó như thế này

PHP

interface RepositoryInterface
{
​
    public function all($columns = array('*'));
​
    public function paginate($limit = null, $columns = array('*'));
​
    public function find($id, $columns = array('*'));
​
    public function findByField($field, $value, $columns = array('*'));
​
    public function findWhere( array $where , $columns = array('*'));
​
    public function findWhereIn( $field, array $values, $columns = array('*'));
​
    public function findWhereNotIn( $field, array $values, $columns = array('*'));
​
    public function create(array $attributes);
​
    public function update(array $attributes, $id);
​
    public function delete($id);
​
    public function with($relations);
​
    public function hidden(array $fields);
​
    public function visible(array $fields);
​
    public function scopeQuery(\Closure $scope);
​
    public function getFieldsSearchable();
​
    public function setPresenter($presenter);
​
    public function skipPresenter($status = true);
}
Thế là ta đã có một cái interface khá ngon lành rồi nhé. Tiếp theo là làm sao để áp dụng cái interface này cho hiệu quả. Tất nhiên, ta có thể làm, ứng với mỗi một repository, ta sẽ viết nội dung cụ thể cho từng hàm khai báo trong interface, kiểu như

PHP

class UserRepository implements RepositoryInterface
{
    public function all($columns = array('*'))
    {
        return User::all($columns);
    }
}
Đại loại là như vậy. Nhưng tất nhiên, nếu bạn làm thế thì sẽ bị cười cho thối mũi, vì làm thế thì thà không có cái Interface kia còn hơn.Nghĩ kĩ hơn một chút, ta sẽ thấy, về cách thức hoạt động, tìm tất cả User với lại tìm tất cả Post nó cũng không khác nhau là mấy, chỉ khác mỗi việc gọi đến Model nào thôi. OK, đến đây thì có vẻ hướng đi đã rõ ràng hơn rồi. Ta sẽ cần viết một abstract class, implements Interface ở trên. Trong class abstract này, ta sẽ cụ thể hóa phần body cho các hàm mà ta nghĩ là sẽ giống nhau giữa các Repository, đồng thời ta cần đảm bảo rằng, các class cụ thể khi extends abstract class này, sẽ phải thực hiện việc truyền Model thích hợp vào cho nó. Theo lối suy nghĩ đó, ta có thể viết thành như sau

PHP

abstract class BaseRepository implements RepositoryInterface
{
​
    protected $app;
​
    protected $model;
​
    protected $fieldSearchable = array();
​
    protected $presenter;
​
    protected $validator;
​
    protected $rules = null;
​
    protected $criteria;
​
    protected $skipCriteria = false;
​
    protected $skipPresenter = false;
​
    protected $scopeQuery = null;
​
    public function __construct(Application $app)
    {
        $this->app = $app;
        $this->criteria = new Collection();
        $this->makeModel();
        $this->makePresenter();
        $this->makeValidator();
        $this->boot();
    }
​
    public function boot()
    {
​
    }
​
    public function resetModel()
    {
        $this->makeModel();
    }
​
    abstract public function model();
​
    public function presenter()
    {
        return null;
    }
​
    public function validator()
    {
​
        if ( isset($this->rules) && ! is_null($this->rules) && is_array($this->rules) && !empty($this->rules) ) {
            if ( class_exists('Prettus\Validator\LaravelValidator') ) {
                $validator = app('Prettus\Validator\LaravelValidator');
                if ($validator instanceof ValidatorInterface) {
                    $validator->setRules($this->rules);
                    return $validator;
                }
            } else {
                throw new Exception( trans('repository::packages.prettus_laravel_validation_required') );
            }
        }
​
        return null;
    }
​
    public function setPresenter($presenter)
    {
        $this->makePresenter($presenter);
        return $this;
    }
​
    public function makeModel()
    {
        $model = $this->app->make($this->model());
​
        if (!$model instanceof Model) {
            throw new RepositoryException("Class {$this->model()} must be an instance of Illuminate\\Database\\Eloquent\\Model");
        }
​
        return $this->model = $model;
    }
​
    public function makePresenter($presenter = null)
    {
        $presenter = !is_null($presenter) ? $presenter : $this->presenter();
​
        if ( !is_null($presenter) ) {
            $this->presenter = is_string($presenter) ? $this->app->make($presenter) : $presenter;
​
            if (!$this->presenter instanceof PresenterInterface ) {
                throw new RepositoryException("Class {$presenter} must be an instance of Prettus\\Repository\\Contracts\\PresenterInterface");
            }
​
            return $this->presenter;
        }
​
        return null;
    }
​
    public function makeValidator($validator = null)
    {
        $validator = !is_null($validator) ? $validator : $this->validator();
​
        if ( !is_null($validator) ) {
            $this->validator = is_string($validator) ? $this->app->make($validator) : $validator;
​
            if (!$this->validator instanceof ValidatorInterface ) {
                throw new RepositoryException("Class {$validator} must be an instance of Prettus\\Validator\\Contracts\\ValidatorInterface");
            }
​
            return $this->validator;
        }
​
        return null;
    }
​
    public function getFieldsSearchable()
    {
        return $this->fieldSearchable;
    }
​
    public function scopeQuery(\Closure $scope){
        $this->scopeQuery = $scope;
        return $this;
    }
​
    public function all($columns = array('*'))
    {
        $this->applyCriteria();
        $this->applyScope();
​
        if ( $this->model instanceof \Illuminate\Database\Eloquent\Builder ){
            $results = $this->model->get($columns);
        } else {
            $results = $this->model->all($columns);
        }
​
        $this->resetModel();
​
        return $this->parserResult($results);
    }
​
    public function paginate($limit = null, $columns = array('*'))
    {
        $this->applyCriteria();
        $this->applyScope();
        $limit = is_null($limit) ? config('repository.pagination.limit', 15) : $limit;
        $results = $this->model->paginate($limit, $columns);
        $this->resetModel();
        return $this->parserResult($results);
    }
​
    public function find($id, $columns = array('*'))
    {
        $this->applyCriteria();
        $this->applyScope();
        $model = $this->model->findOrFail($id, $columns);
        $this->resetModel();
        return $this->parserResult($model);
    }
​
    public function findByField($field, $value = null, $columns = array('*'))
    {
        $this->applyCriteria();
        $this->applyScope();
        $model = $this->model->where($field,'=',$value)->get($columns);
        $this->resetModel();
        return $this->parserResult($model);
    }
​
    public function findWhere( array $where , $columns = array('*'))
    {
        $this->applyCriteria();
        $this->applyScope();
​
        foreach ($where as $field => $value) {
            if ( is_array($value) ) {
                list($field, $condition, $val) = $value;
                $this->model = $this->model->where($field,$condition,$val);
            } else {
                $this->model = $this->model->where($field,'=',$value);
            }
        }
​
        $model = $this->model->get($columns);
        $this->resetModel();
​
        return $this->parserResult($model);
    }
​
    public function findWhereIn( $field, array $values, $columns = array('*'))
    {
        $this->applyCriteria();
        $model = $this->model->whereIn($field, $values)->get($columns);
        $this->resetModel();
        return $this->parserResult($model);
    }
​
    public function findWhereNotIn( $field, array $values, $columns = array('*'))
    {
        $this->applyCriteria();
        $model = $this->model->whereNotIn($field, $values)->get($columns);
        $this->resetModel();
        return $this->parserResult($model);
    }
​
    public function create(array $attributes)
    {
        if ( !is_null($this->validator) ) {
            $this->validator->with($attributes)
                ->passesOrFail( ValidatorInterface::RULE_CREATE );
        }
​
        $model = $this->model->newInstance($attributes);
        $model->save();
        $this->resetModel();
​
        event(new RepositoryEntityCreated($this, $model));
​
        return $this->parserResult($model);
    }
​
    public function update(array $attributes, $id)
    {
        $this->applyScope();
​
        if ( !is_null($this->validator) ) {
            $this->validator->with($attributes)
                ->setId($id)
                ->passesOrFail( ValidatorInterface::RULE_UPDATE );
        }
​
        $_skipPresenter = $this->skipPresenter;
​
        $this->skipPresenter(true);
​
        $model = $this->model->findOrFail($id);
        $model->fill($attributes);
        $model->save();
​
        $this->skipPresenter($_skipPresenter);
        $this->resetModel();
​
        event(new RepositoryEntityUpdated($this, $model));
​
        return $this->parserResult($model);
    }
​
    public function delete($id)
    {
        $this->applyScope();
​
        $_skipPresenter = $this->skipPresenter;
        $this->skipPresenter(true);
​
        $model = $this->find($id);
        $originalModel = clone $model;
​
        $this->skipPresenter($_skipPresenter);
        $this->resetModel();
​
        $deleted = $model->delete();
​
        event(new RepositoryEntityDeleted($this, $originalModel));
​
        return $deleted;
    }
​
    public function with($relations)
    {
        $this->model = $this->model->with($relations);
        return $this;
    }
​
    public function hidden(array $fields)
    {
        $this->model->setHidden($fields);
        return $this;
    }
​
    public function visible(array $fields)
    {
        $this->model->setVisible($fields);
        return $this;
    }
}
Hơi dài một chút, nhưng nếu cần chú ý thì trong này, quan trọng nhất là khai báo

PHP

abstract public function model();
Khai báo này sẽ đảm bảo việc tất cả các class khác, khi extends class BaseRepository này, đều phải có hàm public function model() . Tiếp theo đó, hàm makeModel() sẽ trả về cho ta Model tương ứng để sử dụng. Phần việc tiếp theo đây đã trở nên hết sức rõ ràng rồi. Tiếp tục áp dụng Dependency Injection như đã giới thiệu trong bài viết trước, ta có thể viết đại loại như sau.

PHP

class UserRepository extends BaseRepository {
​
    public function model()
    {
        return User::class;
    }
}
PHP

class UserController extends Controller {
​
    protected $repository;
​
    public function __construct(UserRepository $repository)
    {
        $this->repository = $repository;
        parent::__construct();
    }
​
    public function index()
    {
        $users = $this->repository->all();
​
        return View::make('categories.index', $users);
    }
}
Trên đây là một ví dụ hết sức đơn giản về việc áp dụng RDP. Ngoài việc làm cho cấu trúc code của ta trở nên dễ nhìn, dễ hiểu và tách biệt rõ ràng ra, có thể dễ dàng nhận thấy một vài ưu điểm sau khi ta viết code theo phong cách này :

Giảm thiểu được khá nhiều việc trùng lặp code : Cái này thì dễ thấy rồi, dù ta có tạo ra thêm bao nhiêu model đi chăng nữa, thì những thao tác đơn giản và thông dụng như CRUD hay paginate, ta chỉ cần phải viết đúng một lần duy nhất.
Nhanh : Có thể bạn sẽ mất thời gian một chút để chuẩn bị phần base, nhưng sau đó, tất cả mọi thứ đều đã sẵn sàng cho ta sử dụng . Cái này là hệ quả tất yếu của việc giảm code trùng lặp.
Giảm thiểu sai sót : Bộ khung đã được dựng sẵn từ trước, những yếu tố cần thiết nhất định phải có đều đã được ràng buộc phải khai báo.Với cách làm này, rõ ràng là dù cho có người mới tham gia vào dự án, cũng có thể dễ dàng viết được code đúng và chuẩn hơn.
Giảm công sức maintain : Code dễ đọc hơn, cộng với việc tập trung data access logic khiến cho khi có thay đổi gì, công việc maintain code đã nhẹ nhàng hơn rất nhiều.
Trong khuôn khổ hạn hẹp của bài viết, ví dụ nho nhỏ đưa ra, có lẽ chưa làm nổi bật được hết cái hay của RDP, chẳng hạn như, kia mới chủ yếu là phần data access logic, chưa có nhiều ví dụ về việc gói kèm data mapper / wrapper hay query object vào trong một Repository. Nếu có hứng thú muốn tìm hiểu sâu hơn, bạn có thể nghiên cứu thêm về package này : l5-repository . Ví dụ trong bài viết cũng lấy từ package này mà ra. Với laravel, muốn cài thêm package này vào cũng tương đối đơn giản, trước tiên là chạy composer require prettus/l5-repository, sau đó thêm

PHP

Prettus\Repository\Providers\RepositoryServiceProvider::class,
vào trong config/app.php là xong.
